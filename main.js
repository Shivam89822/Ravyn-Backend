require('dotenv').config();
const express = require('express');
const helmet = require('helmet')
const ratelimiter = require("express-rate-limit"); 
const cors = require("cors");
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT||5000; 
const { Server } = require('socket.io');
const socketHandler = require('./socket');
const { createServer } = require('http')
const cron = require("node-cron");
const cleanupExpiredStatuses = require("./jobs/cleanupExpiredStatuses");
const UserController=require('./controllers/UserController')
const PostController=require('./controllers/PostController')
const FollowController=require('./controllers/FollowController')
const LikeController=require('./controllers/LikeController')
const CommentController=require('./controllers/CommentController')
const MessageController=require('./controllers/MessageController')
const StatusController=require('./controllers/StatusController')
const BlockController=require('./controllers/BlockController')
const NotificationController=require('./controllers/NotificationController')



cron.schedule("*/5 * * * *", async () => {
  await cleanupExpiredStatuses();
});

const allowedOrigins = [
  "http://localhost:3000",
  "https://ravynshivam.netlify.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
   

app.use(express.json()); 
app.use(helmet());     


const limiter = ratelimiter({ 
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, 
  legacyHeaders: false,
});

app.use(limiter);

const main=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connection Succefull ✅")
    }
    catch(e){
        console.log("Connection Failed ❌")
    }
}
main()

const ioServer=createServer(app);
const io = new Server(ioServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  }
});

socketHandler(io);


app.get('/', (req, res) => {
  return res.send("hello"); 
});

app.post('/api/auth/register',UserController.CreateUser)
app.post('/api/auth/login',UserController.Sigin)
app.post('/api/auth/verify',UserController.VerifyUser)
app.patch('/api/users/:userId',UserController.CompleteProfile)
app.post("/api/post/saved",PostController.savePost)
app.get("/api/post/fetchone",PostController.fetchOnePost);
app.post("/api/block/blockuser",BlockController.blockUser);
app.delete("/api/block/unblockuser",BlockController.unblockUser);
app.post("/api/follow/rejectreq",FollowController.rejectRequest)
app.get("/api/post/fetchviralreel",PostController.fetchViralReels)
app.get("/api/block/checkblock",BlockController.checkBlock);
app.get("/api/block/fetchblock",BlockController.fetchBlocked);
app.put("/api/user/update-interests",UserController.updateIntrest)
app.delete("/api/post/removesave",PostController.unsavePost);
app.get("/api/user/notifications",NotificationController.nofications);
app.put("/api/user/update-notifications",NotificationController.updateNotification);
app.get('/api/user/fetchuser',UserController.suggestPlayer)
app.get("/api/post/fetchComment",CommentController.fetchComments);
app.get("/api/savedpost/:userId",PostController.fetchSavedReels);
app.post("/api/post/likeComment",CommentController.likeComment)
app.post("/api/post/unlikeComment",CommentController.dislikeComment)
app.get('/api/users/:name', UserController.getUserInfo);
app.get('/api/singleuser/:id', UserController.getUser);
app.post("/api/follow/acceptreq",FollowController.acceptReq);
app.get('/api/post/:name',PostController.fetchPost)
app.post('/api/follow',FollowController.followUser)
app.get('/api/follow/check',FollowController.checkFollow)
app.delete('/api/unfollow',FollowController.unfollow)
app.get("/api/user/feed",PostController.fetchFeed)
app.post("/api/post/like",LikeController.likePost)
app.post("/api/post/unlike",LikeController.unlikePost);
app.post("/api/post/comment",CommentController.postComment);
app.post("/api/message/sendMessage",MessageController.sendMsg)
app.get('/api/fetchConversation',MessageController.fetchConversation)
app.get('/api/fetchMessage',MessageController.fetchMessage);
app.post("/api/reels/share",MessageController.sendReels)
app.get("/api/reels/search",PostController.fetchAllReels)
app.get("/api/reels",PostController.fetchReels);
app.post('/api/posts',PostController.CreatePost);
app.post("/api/status/post",StatusController.addStatus)
app.get("/api/status/get",StatusController.fetchStatus);
app.get("/api/notification/fetch",NotificationController.fetchNotification)

ioServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});