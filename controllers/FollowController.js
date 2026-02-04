require('dotenv').config();
const mongoose = require('mongoose');
const Follow = require('../schemas/Follow');
const User=require('../schemas/User');
const Notification=require('../schemas/Notification');

const Post = require('../schemas/Post');


exports.checkFollow = async (req, res) => {
  try {
    const { follower, following } = req.query;

    if (!follower || !following) {
      return res
        .status(400)
        .json({ error: "follower and following required" });
    }

    const user1 = await User.findOne({ userName: follower });
    const user2 = await User.findOne({ userName: following });

    if (!user1 || !user2) {
      return res.status(404).json({ message: "User not found" });
    }

    const follow = await Follow.findOne({
      followerId: user1._id,
      followingId: user2._id,
    });

  
    if (!follow) {
      return res.status(200).json({
        isFollowing: false,
        isPending: false,
      });
    }

    return res.status(200).json({
      isFollowing: follow.status === "accepted",
      isPending: follow.status === "pending",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
};



exports.followUser = async (req, res) => {
  const { follower, following } = req.body;

  if (follower === following) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  const user1 = await User.findOne({ userName: follower });
  const user2 = await User.findOne({ userName: following });

  if (!user1 || !user2) {
    return res.status(404).json({ message: "User not found" });
  }

  const already = await Follow.findOne({
    followerId: user1._id,
    followingId: user2._id,
  });

  if (already) {
    return res
      .status(400)
      .json({ message: "Already followed or request pending" });
  }

  if (user2.isPrivate) {
    await Follow.create({
      followerId: user1._id,
      followingId: user2._id,
      status: "pending",
    });

    await Notification.create({
      type:"follow_request",
      recipientId:user2._id,
      actors:[user1._id]
    })

    return res.status(200).json({
      message: "Follow request sent",
      status: "pending",
    });
  }


  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Follow.create(
      [
        {
          followerId: user1._id,
          followingId: user2._id,
          status: "accepted",
        },
      ],
      { session }
    );
    
  const notify = await Notification.findOne(
  {
    recipientId: user2._id,
    type: "follow"
  },
  null,
  { session }  
  )

  if(notify){
    notify.actors.push(user1._id);
    await notify.save();
  }else{
    await Notification.create([{
       type:"follow",
      recipientId:user2._id,
      actors:[user1._id]
    }],{session})
  }
    await User.updateOne(
      { _id: user2._id },
      { $inc: { followerCount: 1 } },
      { session }
    );

    await User.updateOne(
      { _id: user1._id },
      { $inc: { followingCount: 1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Followed successfully",
      status: "accepted",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};


exports.unfollow = async (req, res) => {
  try {
    const { follower, following } = req.body;

    const user1 = await User.findOne({ userName: follower });
    const user2 = await User.findOne({ userName: following });
    const notify = await Notification.findOne({
      recipientId: user2._id,
      actors: { $in: [user1._id] }
    });

    if (!user1 || !user2) {
      return res.status(404).json({ error: "User not found" });
    }

    const follow = await Follow.findOne({
      followerId: user1._id,
      followingId: user2._id,
    });

    if (!follow) {
      return res.status(400).json({ message: "Not following" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      
      await Follow.deleteOne({ _id: follow._id }, { session });

      await Notification.deleteOne({_id:notify._id},{session});

  
      if (follow.status === "accepted") {
        await User.updateOne(
          { _id: user2._id },
          { $inc: { followerCount: -1 } },
          { session }
        );

        await User.updateOne(
          { _id: user1._id },
          { $inc: { followingCount: -1 } },
          { session }
        );
      }
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ message: "Unfollowed successfully" });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
};


exports.acceptReq = async (req, res) => {
  try {
    const { followerId, followingId ,notifyId} = req.body;
    const follow = await Follow.findOne({ followerId, followingId });
    const user1 = await User.findOne({ _id: followerId });
    const user2 = await User.findOne({ _id: followingId });
    if (!user1 || !user2) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!follow) {
      return res.status(404).json({ message: "Follow request not found" });
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await User.updateOne(
        { _id: followerId },
        { $inc: { followingCount: 1 } },
        { session }
      );

      await User.updateOne(
        { _id: followingId },
        { $inc: { followersCount: 1 } },
        { session }
      );
      await Notification.updateOne(
        { _id: notifyId },
        { type: "follow" },
        { session }
      );

      await Follow.updateOne(
        { _id: follow._id },
        { status: "accepted" },
        { session }
      );
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: "Follow request accepted" });
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
};


exports.rejectRequest = async (req, res) => {
  try {
    const { notifyId } = req.body;

    const notify = await Notification.findById(notifyId);
    if (!notify) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const followingId = notify.recipientId;
    const followerId = notify.actors[0];

    await Follow.deleteOne({ followerId, followingId });
    await Notification.deleteOne({ _id: notifyId });

    return res.status(200).json({ message: "successfully rejected" });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
