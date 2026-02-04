const mongoose=require("mongoose")
const Schema= mongoose.Schema

const MessageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    index: true,
    required: true
  },

  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  type: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },

  content: {
    type: String,
    required: true
  },

  mediaMeta: {
  publicId: String,
  mediaUrl: String,   
  thumbnailUrl: String,
  size: Number,
  mimeType: String,
  ownerProfile:String,
  ownerName:String,
  caption:String,
},

  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
},
{
  timestamps: true,
  collection: "Message"
})


const Message=mongoose.model('Message',MessageSchema)
module.exports=Message