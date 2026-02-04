require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../schemas/Post');
const User=require('../schemas/User')
const Follow = require('../schemas/Follow');
const Like = require('../schemas/Like');
const Saved = require('../schemas/Saved');



exports.CreatePost=async(req,res)=>{
    const data=req.body;
    if(!data){
        return res.status(400).json({error:"User Data Not Found"})
    }

    try{
        const newPost=new Post(data);
        const response=await newPost.save();
        
        if(!response){
           return res.status(400).json({error:"Post not saved"})
        }
        return res.status(200).json({message:"Post Saved"})
    }
    catch(e){
        console.log(e)
        return res.status(500).json({error:e})
    }  

}

exports.fetchPost=async(req,res)=>{
    try{
    const {name}=req.params
    const user=await User.findOne({userName:name});
    if(!user){
        return res.status(404).json({error:"No such User Found"});
    }
    const data=await Post.find({userId:user._id});
    return res.status(200).json(data);
    }
    catch(e){
        console.log(e);
        return res.status(500).json({error:e});

    }
  
}


exports.fetchFeed = async (req, res) => {
  try {
    let { limit = 3, userName, cursor_time } = req.query;
    limit = parseInt(limit);

    const user = await User.findOne({ userName }).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const followingDocs = await Follow.find({
      followerId: user._id,
      status: "accepted"
    }).select("followingId");

    const followingIds = followingDocs.map(f => f.followingId);

    let query = { userId: { $in: followingIds } };

    if (cursor_time) {
      query.createdAt = { $lt: new Date(cursor_time) };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "userName profilePictureUrl");

    const postIds = posts.map(p => p._id);

    const likes = await Like.find({
      userId: user._id,
      postId: { $in: postIds }
    }).select("postId");

    const likedSet = new Set(likes.map(l => l.postId.toString()));

    const feed = posts.map(p => ({
      ...p.toObject(),
      isLiked: likedSet.has(p._id.toString())
    }));

     const saved = await Saved.find({
      userId: user._id,
      postId: { $in: postIds }
    }).select("postId");

    const savedSet = new Set(saved.map(l => l.postId.toString()));

    const finalFeed = feed.map(p => ({
      ...p,
      isSaved: savedSet.has(p._id.toString())
    }));


    const nextCursor =
      posts.length > 0 ? posts[posts.length - 1].createdAt : null;

    res.status(200).json({
      posts: finalFeed,
      nextCursor
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.fetchViralReels = async (req, res) => {
  try {
    const { viralCursor } = req.query;
    const limit = 3;

    // Fix: Ensure we only filter by date if a valid cursor exists
    const query = (viralCursor && viralCursor !== "null")
      ? { createdAt: { $lt: new Date(viralCursor) } }
      : {};

    const reels = await Post.find(query)
      .sort({ createdAt: -1 }) // Sorting by createdAt is safer for cursor pagination
      .limit(limit + 1)
      .populate("userId", "userName profilePictureUrl");

    let nextCursor = null;
    if (reels.length > limit) {
      // The cursor should be the createdAt date of the last item in the limit
      nextCursor = reels[limit - 1].createdAt;
      reels.pop(); // Remove the +1 item
    }

    res.status(200).json({
      reels,
      nextCursor
    });
  } catch (e) {
    console.error("Error in fetchViralReels:", e); // This helps you see the error in terminal
    res.status(500).json({ message: "Backend Error", error: e.message });
  }
};



exports.fetchReels = async (req, res) => {
  try {
    const { cursorTime, userId } = req.query;
    const limit = 3;

    const query = { type: "video" };

    if (cursorTime) {
      query.createdAt = { $lt: new Date(cursorTime) };
    }

    const reels = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("userId", "userName profilePictureUrl");

    const postIds = reels.map(p => p._id);

    const savedDocs = await Saved.find({
      userId,
      postId: { $in: postIds }
    }).select("postId");

    const likedDocs = await Like.find({
      userId: new mongoose.Types.ObjectId(userId),
      postId: { $in: postIds }
    }).select("postId");

    const savedSet = new Set(savedDocs.map(s => s.postId.toString()));
    const likedSet = new Set(likedDocs.map(l => l.postId.toString()));

    const feeds = reels.map(p => {
      const obj = p.toObject();
      return {
        ...obj,
        isSaved: savedSet.has(p._id.toString()),
        isLiked: likedSet.has(p._id.toString())
      };
    });

    const hasMore = feeds.length > limit;
    if (hasMore) feeds.pop();

    const nextCursorTime =
      feeds.length > 0 ? feeds[feeds.length - 1].createdAt : null;

    return res.status(200).json({
      reels: feeds,
      nextCursorTime,
      hasMore
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.fetchAllReels=async(req,res)=>{
  try{
    const {cursorTime}=req.query;
    const limit=15;
    
    const post=await Post.find(cursorTime?{$lt: new Date(cursorTime)}:{}).limit(limit+1).populate("userId","userName profilePictureUrl").sort({ createdAt: -1 })
    const hasMore = post.length > limit;
    if (hasMore) post.pop();
    const nextCursorTime =
    post.length > 0 ? post[post.length - 1].createdAt : null;
    return res.status(200).json({
      reels: post,
      nextCursorTime,
      hasMore
    });
  }
  catch(e){
    console.log(e);
    return res.status(500).json({message:"Internal server error"});
  }
}


exports.savePost=async(req,res)=>{
  const {userId,postId}=req.body;
  if(!userId||!postId)return res.status(404).json({message:"data not found"});
  try{
    const response=await Saved.create({
      userId:userId,
      postId:postId
    })
    return res.status(200).json({message:"saved"});
  }
  catch(e){
    console.log(e)
    return res.status(500).json({message:"Internal server error"})
  }
}


exports.unsavePost = async (req, res) => {
  const { userId, postId } = req.body;

  if (!userId || !postId) {
    return res.status(400).json({ message: "userId and postId required" });
  }

  try {
    const response = await Saved.deleteOne({
      userId,
      postId,
    });

    if (response.deletedCount === 0) {
      return res.status(404).json({ message: "Post not found in saved list" });
    }

    return res.status(200).json({ message: "unsaved" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.fetchSavedReels=async(req,res)=>{
  try{
    const {userId}=req.params;
    if(!userId)return res.status(404).json({message:"User Id not found"});
    const reels=await Saved.find({userId:userId}).populate("postId","mediaUrl likeCount commentCount type");
    return res.status(200).json(reels);

  }catch(e){
    console.log(e);
    return res.status(500).json({message:"Internal Server error"});
  }
}


exports.fetchOnePost=async(req,res)=>{
  try{
    const {reelId}=req.query;
    if(!reelId) return res.status(404).json({message:"reel Id not found"});
    const reel=await Post.findOne({_id:reelId}).populate("userId", "userName profilePictureUrl");
    return res.status(200).json(reel);
  }catch(e){
    console.log(e);
    return res.status(500).json({message:"Internal Server error"});
  }
}