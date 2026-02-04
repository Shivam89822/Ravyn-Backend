const mongoose=require("mongoose")
const Schema= mongoose.Schema

const LikeSchema=new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
},
{
    timestamps: true,          
    collection: "Like",       
  })

const Like=mongoose.model('Like',LikeSchema)
module.exports=Like;