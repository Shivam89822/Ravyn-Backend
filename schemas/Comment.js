const mongoose = require("mongoose");
const { Schema } = mongoose;


const CommentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    },
    text: { type: String, required: true },
    likeCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);
const Comment = mongoose.model("Comment", CommentSchema);
module.exports = Comment;