const Status = require("../schemas/Status");
const cloudinary = require("cloudinary").v2;

// Cloudinary config (do this ONCE)
cloudinary.config({
  cloud_name: "dksrg9oqk",
  api_key: "975283121343333",
  api_secret: "2kwWtqteHZ8sx1InswiowZFlprA"
});

const cleanupExpiredStatuses = async () => {
  try {
    const now = new Date();

    const expiredStatuses = await Status.find({
      expiresAt: { $lte: now },
      isActive: true
    });

    for (const status of expiredStatuses) {
      if (status.mediaPublicId) {
        await cloudinary.uploader.destroy(
          status.mediaPublicId,
          {
            resource_type:
              status.type === "video" ? "video" : "image"
          }
        );
      }

      status.isActive = false;
      await status.save();
    }

    console.log(`🧹 Cleaned ${expiredStatuses.length} expired statuses`);
  } catch (err) {
    console.error("❌ Status cleanup failed:", err.message);
  }
};

module.exports = cleanupExpiredStatuses;
