require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('../schemas/Message');
const User=require('../schemas/User')
const Post=require('../schemas/Post')

const Conversation=require('../schemas/Conversation')



exports.sendMsg = async (req, res) => {
  try {
    const { senderId, reciverId, text } = req.body;


    if (!senderId || !reciverId || !text) {
      return res.status(400).json({ message: "Missing data" });
    }

    const sender = new mongoose.Types.ObjectId(senderId);
    const receiver = new mongoose.Types.ObjectId(reciverId);

 
    let conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver] },
      isGroup: false
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sender, receiver],
        isGroup: false
      });
    }

    const newMessage=await Message.create({
      conversationId: conversation._id,
      senderId: sender,
      type: "text",
      content: text
    });
    


    conversation.lastMessage = text;
    conversation.lastMessageSender = sender;
    await conversation.save();

    return res.status(200).json({
      conversationId: conversation._id,
      message:newMessage
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Backend error" });
  }
};



exports.fetchConversation = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const conversations = await Conversation.find({
      participants: userObjectId
    })
      .populate("participants", "userName fullName profilePictureUrl") 
      .sort({ updatedAt: -1 });

  
    const formatted = conversations.map(conv => {
      const friend = conv.participants.find(
        p => p._id.toString() !== userId
      );

      return {
        conversationId: conv._id,
        friendId: friend?._id,
        friendUserName:friend?.userName,
        friendName: friend?.fullName,
        friendProfilePic: friend?.profilePictureUrl,
        lastMessage: conv.lastMessage,
        lastMessageSender: conv.lastMessageSender,
        updatedAt: conv.updatedAt
      };
    });

    return res.status(200).json(formatted);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Backend error" });
  }
};




exports.fetchMessage = async (req, res) => {
  try {
    const { conversationId, cursorTime } = req.query;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId" });
    }

    const messages = await Message.find({
      conversationId,
      createdAt: { $lt: new Date(cursorTime) },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json(messages.reverse());

  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Backend error" });
  }
};




exports.sendReels = async (req, res) => {
  try {
    const { users, postId, sender } = req.body;

    const senderId = new mongoose.Types.ObjectId(sender);
    const post = await Post.findById(postId).populate("userId","userName profilePictureUrl")

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const messageText = "Shared a reel";

    for (const userId of users) {
      const receiverId = new mongoose.Types.ObjectId(userId);

      let conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
          isGroup: false,
          lastMessage: messageText,
          lastMessageSender: senderId,
        });
      }

      await Message.create({
        conversationId: conversation._id,
        senderId: senderId,
        type: post.type,
        content: messageText,
        mediaMeta: {
          publicId: post._id.toString(),
          mediaUrl: post.mediaUrl || "",
          thumbnailUrl: post.thumbnailUrl || "",
          size: post.size || null,
          mimeType: "reel",
          ownerName:post.userId.userName,
          ownerProfile:post.userId.profilePictureUrl,
          caption:post.caption,
        },
      });

      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: messageText,
        lastMessageSender: senderId,
      });
    }

    res.status(200).json({ success: true, message: "Reel shared successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
