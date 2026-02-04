const mongoose = require("mongoose");

const FollowSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      required: true,
    },
  },
  { timestamps: true,
    collection: "Follow"
   }

);

// 🔒 Prevent duplicate follows
FollowSchema.index(
  { followerId: 1, followingId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Follow", FollowSchema);
