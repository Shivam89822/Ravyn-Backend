require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../schemas/User');
const Block = require('../schemas/Block');

const jwt=require("jsonwebtoken")
const bcrypt=require("bcrypt")


exports.CreateUser = async (req, res) => {
  try {
    const {user} = req.body;
    console.log(user)
    if (!user) return res.status(400).json({ error: "User not Found" });

    // check if user already exists
    const check=await User.findOne({email:user.email})
    if(check){
      return res.status(400).json({error:"User with this email already exist Just Sign in"})
    }

    const hash = await bcrypt.hash(user.password, 10);
    if(!hash){

    }
    user.password = hash;

    const newUser = new User(user);
    const response = await newUser.save();
    if (!response) return res.status(400).json({ error: "Error in saving user"});
    const {password,...safeUser}=newUser._doc

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '10h' });
    return res.status(200).json({ token:token,user:safeUser});
  } catch (e) {
    console.error("Error in CreateUser:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};



exports.Sigin = async (req, res) => {
  try {
    const { user } = req.body;
    if (!user) {
      return res.status(400).json({ error: "User data not provided" });
    }

    const userData = await User.findOne({ email: user.email });
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    const checkPassword = await bcrypt.compare(user.password, userData.password);
    if (!checkPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email: userData.email, id: userData._id },
      process.env.JWT_SECRET,
      { expiresIn: "10h" }
    );

    const { password, ...safeUser } = userData._doc;

    return res.status(200).json({
      message: "Sign-in successful",
      token:token,
      user: safeUser
    });
  } catch (e) {
    console.log(e)
    return res.status(500).json({ error: e.message });
  }
}; 



exports.VerifyUser=async(req,res)=>{
  try{
   const authHeader=req.headers.authorization 
   if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authorization header missing or malformed" });
    }
    const token =authHeader.split(' ')[1]
    if(!token){
      return res.status(400).json({error:"Token not found"})
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const email=decoded.email
    try{
      const user=await User.findOne({email})
      if(!user){
        return res.status(404).json({error:"User not found"})
      }
      return res.status(200).json({user:user})
    }catch(e){
      return res.status(400).json({error:e.message})
    }
  }catch(e){
    res.status(500).json({error:e.message})
  }
}


exports.CompleteProfile=async(req,res)=>{
  try{
  const data=req.body;
  if(!data){
    res.status(400).json({error:"Data not Found at backend"});
  }
  if(data.profilePic){
    delete data.profilePic;
  }
  
  const user = await User.findOneAndUpdate(
  { email: data.email },   
  { $set: data },        
  { new: true }         
  );
  if(!user){
    res.status(400).json({error:"User not updated"});
  }
  res.status(200).json(user);
  }
  catch(e){
    res.status(500).json({error:"Internal Server Error"});
  }  
   
}



exports.suggestPlayer = async (req, res) => {
  try {
    const { data, userId } = req.query;

    if (!data || !userId) {
      return res.status(400).json({ message: "Search text required" });
    }

    const blockedRelations = await Block.find({
      $or: [
        { blockedId: userId },
        { blockerId: userId }
      ]
    });

    const blockedUserIds = new Set();

    blockedRelations.forEach(block => {
      if (block.blockerId.toString() !== userId) {
        blockedUserIds.add(block.blockerId.toString());
      }
      if (block.blockedId.toString() !== userId) {
        blockedUserIds.add(block.blockedId.toString());
      }
    });

    const users = await User.find({
      userName: { $regex: `^${data}`, $options: "i" },
      _id: { $nin: Array.from(blockedUserIds) }
    })
      .select("fullName userName Location profilePictureUrl")
      .limit(5);

    return res.status(200).json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.getUserInfo = async (req, res) => {
  try {
    const { name } = req.params; 

    if (!name) {
      return res.status(400).json({ message: "Username required" });
    }

    const user = await User.findOne({ userName: name })
      .select("userName fullName bio intrests profilePictureUrl Location isPrivate followerCount followingCount postCount");

    if (!user) {
      return res.status(404).json({ message: "No Such User Found" });
    }

    return res.status(200).json(user);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Server error" });
  }
};


exports.getUser=async(req,res)=>{
  try {
    const { id } = req.params; 

    if (!id) {
      return res.status(400).json({ message: "Username required" });
    }

    const user = await User.findOne({ _id: id })
      .select("userName fullName bio intrests profilePictureUrl Location isPrivate followerCount followingCount postCount");

    if (!user) {
      return res.status(404).json({ message: "No Such User Found" });
    }

    return res.status(200).json(user);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Server error" });
  } 
}


exports.updateIntrest=async(req,res)=>{
  try {
    const { userId, interests } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: { intrests: interests }
      },
      { new: true }
    ).select("intrests");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser.intrests);
  } catch (error) {
    res.status(500).json({ message: "Failed to update interests", error: error.message });
  }
}