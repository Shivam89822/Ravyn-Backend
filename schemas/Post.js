const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    type: { type: String, enum: ["image", "video"], required: true },

    mediaUrl: { type: String, required: true },
    publicId: { type: String },

    caption: { type: String, default: "" },

    isCommentAllowed: { type: Boolean, default: true },

    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },

    hashtags: [{ type: String, lowercase: true }],

    shareCount: { type: Number, default: 0 },
    
  },
  {
    timestamps: true,
    collection: "Post",
  }
);

module.exports = mongoose.model("Post", PostSchema);
