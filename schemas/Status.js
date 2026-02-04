const mongoose=require("mongoose")
const StatusElementSchema = require("./StatusElement");
const StatusSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  type: { type: String, enum: ["text", "image", "video"], required: true },

  text: { type: String, maxLength: 300, default: "" },

  mediaUrl: { type: String, default: null },
  mediaPublicId: { type: String, default: null },

  backgroundColor: { type: String, default: "#000000" },
  elements: [StatusElementSchema],

  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  viewCount: { type: Number, default: 0 },

  privacy: {
    type: String,
    enum: ["public", "followers", "close_friends"],
    default: "followers"
  },

  isActive: { type: Boolean, default: true },

  expiresAt: { type: Date, required: true }
}, { timestamps: true });

StatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Status", StatusSchema);