const mongoose = require("mongoose");
const { Schema } = mongoose;

const BlockSchema = new Schema(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason:{
      type:String,
      enum: [
        "spam",
        "hate_content",
        "harassment",
        "fake_account",
        "nudity",
        "other"
      ],
      default: "other"
    },
    blockedId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "Block",
  }
);

// 🔥 VERY IMPORTANT: prevent duplicate blocks
BlockSchema.index(
  { blockerId: 1, blockedId: 1 },
  { unique: true }
);

const Block = mongoose.model("Block", BlockSchema);
module.exports = Block;
