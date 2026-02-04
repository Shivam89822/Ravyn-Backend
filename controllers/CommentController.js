require('dotenv').config();
const mongoose = require('mongoose');
const Comment = require('../schemas/Comment');
const Post = require('../schemas/Post');
const User = require('../schemas/User');
const CommentLike = require('../schemas/CommentLike');
const Notification = require('../schemas/Notification');





exports.postComment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { user, post, text } = req.body;

    if (!user || !post || !text) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid data" });
    }

    const [comment] = await Comment.create(
      [
        {
          postId: post,
          userId: user,
          text: text
        }
      ],
      { session }
    );

    const postDoc = await Post.findByIdAndUpdate(
      post,
      { $inc: { commentCount: 1 } },
      { session, new: true }
    );

    if (String(postDoc.userId) !== String(user)) {
      const notify = await Notification.findOne(
        {
          type: "post_comment",
          postId: post,
          recipientId: postDoc.userId
        },
        null,
        { session }
      );

      if (!notify) {
        await Notification.create(
          [
            {
              type: "post_comment",
              recipientId: postDoc.userId,
              actors: [user],
              actorsCount: 1,
              postId: post,
              commentId: comment._id
            }
          ],
          { session }
        );
      } else {
        await Notification.updateOne(
          { _id: notify._id },
          {
            $addToSet: { actors: user },
            $inc: { actorsCount: 1 },
            $set: { commentId: comment._id } 
          },
          { session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Comment saved" });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};



exports.fetchComments = async (req, res) => {
  try {
    const { postId, userId } = req.query;

    if (!postId) {
      return res.status(400).json({ message: "PostId required" });
    }

    
    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .populate("userId", "userName profilePictureUrl");

    
    if (!userId) {
      return res.status(200).json(
        comments.map(c => ({
          ...c.toObject(),
          isLiked: false
        }))
      );
    }


    const commentIds = comments.map(c => c._id);

 
    const likedDocs = await CommentLike.find({
      userId,
      commentId: { $in: commentIds }
    }).select("commentId");


    const likedSet = new Set(
      likedDocs.map(d => d.commentId.toString())
    );

    const finalComments = comments.map(c => ({
      ...c.toObject(),
      isLiked: likedSet.has(c._id.toString())
    }));

    return res.status(200).json(finalComments);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.likeComment = async (req, res) => {
  try {
    const { userId, commentId } = req.body;

    if (!userId || !commentId) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const alreadyLiked = await CommentLike.findOne({ userId, commentId });
    if (alreadyLiked) {
      return res.status(409).json({ message: "Already liked" });
    }

    await CommentLike.create({ userId, commentId });

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { $inc: { likeCount: 1 } },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (String(comment.userId) !== String(userId)) {
      await Notification.findOneAndUpdate(
        {
          type: "comment_like",
          commentId,
          recipientId: comment.userId,
        },
        {
          $addToSet: { actors: userId },
          $setOnInsert: { 
            type: "comment_like",
            recipientId: comment.userId,
            commentId,
            postId: comment.postId 
          }
        },
        { upsert: true, new: true }
      );

      const updatedNotify = await Notification.findOne({
        type: "comment_like",
        commentId,
      });
      
      if (updatedNotify) {
        await Notification.updateOne(
          { _id: updatedNotify._id },
          { $set: { actorsCount: updatedNotify.actors.length } }
        );
      }
    }

    return res.status(200).json({ message: "Comment liked" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.dislikeComment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, commentId } = req.body;

    if (!userId || !commentId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid data" });
    }

    const removed = await CommentLike.findOneAndDelete(
      { userId, commentId },
      { session }
    );

    if (!removed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Like not found" });
    }

    await Comment.updateOne(
      { _id: commentId },
      { $inc: { likeCount: -1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Comment unliked" });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};
