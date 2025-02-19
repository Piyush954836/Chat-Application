const express = require("express");
const multer = require("multer");
const User = require("../models/userModel");

const router = express.Router();

// Multer setup for memory storage (no disk storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", (req, res) => {
    res.render("profile", { user: req.session.user });
  });
// ✅ Upload Profile Photo
router.post("/upload-profile-photo", upload.single("profilePhoto"), async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        if (!user) return res.status(404).send("User not found");

        user.profilePhoto = `data:image/png;base64,${req.file.buffer.toString("base64")}`;
        await user.save();

        req.session.user.profilePhoto = user.profilePhoto; // Update session
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error uploading photo");
    }
});

// ✅ Send Follow Request
router.post("/send-follow-request/:id", async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.session.user._id);

        if (!userToFollow || !currentUser) return res.status(404).send("User not found");

        if (!userToFollow.followRequests.includes(currentUser._id) &&
            !userToFollow.followers.includes(currentUser._id)) {
            userToFollow.followRequests.push(currentUser._id);
            await userToFollow.save();
        }

        res.redirect("/profile/" + userToFollow._id);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error sending follow request");
    }
});

// ✅ Accept Follow Request
router.post("/accept-follow/:id", async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user._id);
        const requestingUser = await User.findById(req.params.id);

        if (!currentUser || !requestingUser) return res.status(404).send("User not found");

        if (currentUser.followRequests.includes(requestingUser._id)) {
            currentUser.followers.push(requestingUser._id);
            requestingUser.following.push(currentUser._id);

            currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requestingUser._id.toString());

            await currentUser.save();
            await requestingUser.save();
        }

        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error accepting follow request");
    }
});

// ✅ Unfollow User
router.post("/unfollow/:id", async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user._id);
        const userToUnfollow = await User.findById(req.params.id);

        if (!currentUser || !userToUnfollow) return res.status(404).send("User not found");

        currentUser.following = currentUser.following.filter(id => id.toString() !== userToUnfollow._id.toString());
        userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUser._id.toString());

        await currentUser.save();
        await userToUnfollow.save();

        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error unfollowing user");
    }
});

module.exports = router;
