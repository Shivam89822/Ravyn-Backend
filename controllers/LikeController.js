require('dotenv').config();
const mongoose = require('mongoose');
const Like = require('../schemas/Like');
const Post = require('../schemas/Post');
const Notification = require('../schemas/Notification');


exports.likePost = async (req, res) => {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const { userId, postId } = req.body;

      const existingLike = await Like.findOne(
        { userId, postId },
        null,
        { session }
      );

      if (existingLike) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Already liked" });
      }

      const post = await Post.findById(postId).session(session);

      await Like.create([{ userId, postId }], { session });

      const notify = await Notification.findOne(
        {
          type: "post_like",
          postId,
          recipientId: post.userId
        },
        null,
        { session }
      );

      if (!notify) {
        await Notification.create(
          [{
            type: "post_like",
            recipientId: post.userId,
            actors: [userId],
            actorsCount: 1,
            postId
          }],
          { session }
        );
      } else {
        await Notification.updateOne(
          { _id: notify._id },
          {
            $addToSet: { actors: userId },
            $inc: { actorsCount: 1 }
          },
          { session }
        );
      }

      await Post.updateOne(
        { _id: postId },
        { $inc: { likeCount: 1 } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ message: "Like added" });

    } catch (e) {
      await session.abortTransaction();
      session.endSession();

    
      if (e.code === 112 || e.errorLabels?.includes("TransientTransactionError")) {
        if (attempt === MAX_RETRIES) {
          return res.status(500).json({ message: "Please retry" });
        }
        continue;
      }

      console.error(e);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};


exports.unlikePost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, postId } = req.body;

    const deletedLike = await Like.findOneAndDelete(
      { userId, postId },
      { session }
    );

    if (!deletedLike) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Not liked yet" });
    }

    // 🔔 Notification handling
    const notify = await Notification.findOne(
      {
        type: "post_like",
        postId
      },
      null,
      { session }
    );

    if (notify) {
      if (notify.actors.length <= 1) {
        // last actor → delete notification
        await Notification.deleteOne(
          { _id: notify._id },
          { session }
        );
      } else {
        // remove current user from actors
        await Notification.updateOne(
          { _id: notify._id },
          {
            $pull: { actors: userId },
            $inc: { actorsCount: -1 }
          },
          { session }
        );
      }
    }

    await Post.findByIdAndUpdate(
      postId,
      { $inc: { likeCount: -1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Like removed" });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
};
