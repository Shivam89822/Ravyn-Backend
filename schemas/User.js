const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    userName: { type: String, required: true, unique: true, lowercase: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: "" },
    isFirstLogin: { type: Boolean, default: true },
    isPrivate: { type: Boolean, defualt: false },
    intrests:{type:[String],defualt:[]},
    Location:{type:String},
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 },
    notifications: {
      push:{type: Boolean, defualt: true},
      email:{type: Boolean, defualt: true},
      message:{type: Boolean, defualt: true}
    },

    profilePictureUrl: { 
      type: String, 
      default: "https://your-server.com/path/to/default-avatar.png",
    },

    profilePicturePublicId: { 
      type: String, 
      default: null,
    },
  },
  {
    timestamps: true,          
    collection: "User",       
  }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
