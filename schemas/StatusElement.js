const mongoose=require("mongoose");

const StatusElementSchema=new mongoose.Schema(
     {
    type: {
      type: String,
      enum: ["text", "sticker", "emoji"],
      required: true
    },

    content: {
      type: String,
      required: true
    },
    width:{
      type: Number,
    min: 0,
    max: 1,
    default: 0.5
    },
    height:{
      type: Number,
    min: 0,
    max: 1,
    default: 0.5
    },

    x: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
    },

    y: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
    },

    rotation: {
      type: Number,
      default: 0
    },

    scale: {
      type: Number,
      default: 1
    },
     opacity:{type: Number, default: 1},

    style: {
      color: { type: String, default: "#ffffff" },
      fontSize: { type: Number, default: 24 },
      fontFamily: { type: String, default: "Poppins" },
      background: { type: String, default: "transparent" },
      fontWeight: { type: String, default: "normal" },
      textAlign: { type: String, default: "center" },
    }
  },
  {
    _id: false 
  }
)

module.exports = StatusElementSchema;