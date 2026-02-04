const mongoose=require("mongoose")
const Schema= mongoose.Schema

const ConversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  isGroup: {
    type: Boolean,
    default: false
  },

  groupName: {
    type: String
  },

  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
    lastMessage: {
    type: String,
    default: ""
  },
  lastMessageSender: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }

},
{
  timestamps: true,
  collection: "Conversation"
})


const Conversation=mongoose.model('Conversation',ConversationSchema)
module.exports=Conversation