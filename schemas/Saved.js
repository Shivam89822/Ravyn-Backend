const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SavedSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    contentType: {
      type: String,
      enum: ["post", "reel"],
      default: "post",
    },
  },
  {
    timestamps: true,
    collection: "Saved",
  }
);


SavedSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model("Saved", SavedSchema);
