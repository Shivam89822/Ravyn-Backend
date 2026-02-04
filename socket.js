const Message = require("./schemas/Message");
const onlineUsers = new Map();

module.exports = function (io) {
  io.on("connection", (socket) => {

    socket.on("user-online", (userId) => {
      socket.userId = userId;

      const existingSocketId = onlineUsers.get(userId);

      if (existingSocketId === socket.id) return;

      onlineUsers.set(userId, socket.id);

      console.log(`User joined with id: ${userId}`);

      socket.emit("presence-init", Array.from(onlineUsers.keys()));

      socket.broadcast.emit("presence-update", {
        userId,
        status: "online",
      });
    });

    socket.on("userMessage", (msg) => {
      io.emit("sendedMsg", `From backend ${msg}`);
    });

    socket.on("sendMessage", async ({ conversationId, messageId }) => {
      const message = await Message.findOne({ _id: messageId });
      socket.to(conversationId).emit("newMessage", message);
    });

    socket.on("joinConversations", (conversationIds) => {
      if (!Array.isArray(conversationIds)) return;
      conversationIds.forEach(id => socket.join(id));
    });

    socket.on("leaveConversations", (conversationIds) => {
      if (!Array.isArray(conversationIds)) return;
      conversationIds.forEach(id => socket.leave(id));
    });

    socket.on("disconnect", () => {
      if (!socket.userId) {
        console.log(`Socket disconnected: ${socket.id}`);
        return;
      }

      const storedSocketId = onlineUsers.get(socket.userId);

      if (storedSocketId === socket.id) {
        onlineUsers.delete(socket.userId);

        socket.broadcast.emit("presence-update", {
          userId: socket.userId,
          status: "offline",
        });
      }

      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
