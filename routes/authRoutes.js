const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/userModel");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.redirect("/auth/login");
    } catch (error) {
        res.send("Error Registering User");
    }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.render("login", { error: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.render("login", { error: "Invalid password" });
      }

      req.session.user = user;
      res.redirect("/profile");

  } catch (err) {
      console.error(err);
      res.render("login", { error: "Something went wrong. Try again." });
  }
});


router.get("/register", (req, res) => {
  res.render("register", { user: req.session.user || null });
});

// ✅ GET Login Page
router.get("/login", (req, res) => {
  res.render("login", { user: req.session.user || null });
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error("Error destroying session:", err);
          return res.redirect("/chat");
      }
      res.redirect("/auth/login");
  });
});


module.exports = router;
