require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../schemas/Notification');
const Post = require('../schemas/Post');
const User = require('../schemas/User');

exports.fetchNotification = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notifications = await Notification.find({
      recipientId: user._id,
    })
      .populate({
        path: "actors",
        select: "userName profilePictureUrl",
      })
      .populate({
        path: "postId",
        select: "mediaUrl caption",
      })
      .sort({ createdAt: -1 });

    const formattedNotifications = notifications.map((n) => {
      const lastActor = n.actors?.at(-1); 

      return {
        _id: n._id,
        type: n.type,
        actorsCount: n.actorsCount,
        isSeen: n.isSeen,
        createdAt: n.createdAt,

        actor: lastActor
          ? {
              _id: lastActor._id,
              userName: lastActor.userName,
              profilePictureUrl: lastActor.profilePictureUrl,
            }
          : null,

        post: n.postId
          ? {
              mediaUrl: n.postId.mediaUrl,
            }
          : null,
      };
    });

    return res.status(200).json({
      data: formattedNotifications,
      message: "Successfully fetched notifications",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.nofications=async(req,res)=>{
  try {
    const { userId } = req.query;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}


exports.updateNotification=async(req,res)=>{
  try {
    const { userId, notifications } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          notifications: {
            push: notifications.push,
            email: notifications.email,
            message: notifications.message 
          }
        } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser.notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to update settings", error: error.message });
  }
}
