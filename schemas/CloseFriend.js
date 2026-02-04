const mongoose = require("mongoose");
const { Schema } = mongoose;

const CloseFriendSchema = new Schema(
  {
    friendMaker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    friend: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "CloseFriend",
  }
);

// 🔥 Prevent duplicate close friends
CloseFriendSchema.index(
  { friendMaker: 1, friend: 1 },
  { unique: true }
);

const CloseFriend = mongoose.model("CloseFriend", CloseFriendSchema);
module.exports = CloseFriend;
