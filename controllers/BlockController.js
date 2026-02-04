const mongoose = require('mongoose');
const Block = require('../schemas/Block');
const User = require('../schemas/User');
const Conversation=require('../schemas/Conversation');

exports.blockUser=async(req,res)=>{
    try{
        const {blockerId,blockedId,reason}=req.body;
        if(!blockedId||!blockedId||!reason){
            return res.status(404).json({message:"Data not found"});
        }
        const response =await Block.create({
            blockedId,
            blockerId,
            reason
        })
        return res.status(200).json({message:"saved successfully"});

    }catch(e){
        console.log(e);
        return res.status(500).json({message:"Internal Server Error"});
    }

}

exports.unblockUser = async (req, res) => {
  try {
    const { blockerId, blockedId } = req.query;

    console.log("UNBLOCK:", blockerId, blockedId);

    if (!blockerId || !blockedId) {
      return res.status(400).json({ message: "Missing data" });
    }

    const result = await Block.findOneAndDelete({
      blockerId,
      blockedId,
    });

    if (!result) {
      return res.status(404).json({ message: "User not blocked" });
    }

    return res.status(200).json({ message: "Unblocked successfully" });

  } catch (e) {
    console.error("UNBLOCK ERROR:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



exports.checkBlock=async(req,res)=>{
    try{
        const {blockerId,blockedId}=req.query;
        const block=await Block.findOne({blockedId,blockerId});
        if(block){
            res.status(200).json(true);
        }else{
            res.status(200).json(false);

        }
    }catch(e){
            res.status(200).json({message:"Internal server error"});

    }
}


exports.fetchBlocked=async(req,res)=>{
  try{
    const {userId}=req.query;
    const data=await Block.find({blockerId:userId}).populate("blockedId","userName profilePictureUrl")
    return res.status(200).json(data);
  }catch(e){
    console.log(e);
    return res.status(500).json({message:"Internal server error"});
  }
}