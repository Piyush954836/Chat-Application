const express = require("express");
const Chat = require("../models/chatModel");
const multer = require("multer");
const router = express.Router();

const storage = multer.diskStorage({
    destination: "./public/uploads",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
      return next();
  }
  res.redirect("/login");
};

// ✅ GET Chat Page (Protected Route)
router.get("/", isAuthenticated, (req, res) => {
  res.render("chat", { user: req.session.user });
});
// Send Message
router.post("/send", upload.single("media"), async (req, res) => {
    const { sender, receiver, message } = req.body;
    const media = req.file ? `/uploads/${req.file.filename}` : null;

    const chat = new Chat({ sender, receiver, message, media });
    await chat.save();
    
    res.status(200).json({ success: true });
});

// Get Messages
router.get("/messages/:friendId", async (req, res) => {
    const { friendId } = req.params;
    const messages = await Chat.find({ $or: [{ sender: req.user.id, receiver: friendId }, { sender: friendId, receiver: req.user.id }] }).populate("sender receiver");
    res.json(messages);
});

module.exports = router;
