const mongoose=require("mongoose")
const Schema= mongoose.Schema

const LikeSchema=new Schema({
    commentId: { type: Schema.Types.ObjectId, ref: 'Comment', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
},
{
    timestamps: true,          
    collection: "Like",       
  })

const CommentLike=mongoose.model('CommentLike',LikeSchema)
module.exports=CommentLike;