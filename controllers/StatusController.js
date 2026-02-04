const mongoose = require('mongoose');
const User = require('../schemas/User');
const Status = require('../schemas/Status');
const Follow = require('../schemas/Follow');



exports.addStatus = async (req, res) => {
  try {
    const { userId, elements, data } = req.body;

    if (!userId || !data) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const status = await Status.create({
      user: userId,
      type: data.type,
      text: data.text || "",
      mediaUrl: data.mediaUrl || null,
      mediaPublicId: data.mediaPublicId || null,
      backgroundColor: data.backgroundColor || "#000000",
      elements: elements || [],
      expiresAt
    });

    return res.status(200).json({ message: "Status created", status });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.fetchStatus = async (req, res) => {
  try {
    const { userId } = req.query;

    const follows = await Follow.find({
      followerId: userId,
      status: "accepted"
    }).select("followingId");

    const followingIds = follows.map(f => f.followingId);
    followingIds.push(userId);

    const status = await Status.find({
      user: { $in: followingIds }
    }).populate("user","userName profilePictureUrl");

    return res.status(200).json(status);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
