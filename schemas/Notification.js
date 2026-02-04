const mongoose=require('mongoose');

const Schema=mongoose.Schema

const NotificationSchema=new Schema({
     type: {
      type: String,
      enum: [
        "follow",
        "follow_request",
        "post_like",
        "comment_like",
        "post_comment"
      ],
      required: true
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    actors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    actorsCount: {
      type: Number,
      default: 1
    },

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post"
    },

    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    },

    isSeen: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true ,collection:"Notification"}
)

module.exports = mongoose.model("Notification", NotificationSchema);