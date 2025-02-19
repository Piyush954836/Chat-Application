require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
const connectDB = require("./config/database"); // Import the database connection
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Session Middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // Store user info globally in EJS templates
  next();
});


app.get("/", (req, res) => {
  res.render("index", { user: req.session.user || null }); // Pass user to EJS
});


// Routes
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);
app.use("/profile", profileRoutes);

// Socket.io Real-Time Chat
io.on("connection", (socket) => {
    console.log("🔵 User connected:", socket.id);

    socket.on("sendMessage", (data) => {
        io.emit("receiveMessage", { message: data.message, sender: socket.id });
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
