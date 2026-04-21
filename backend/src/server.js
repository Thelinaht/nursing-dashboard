const express = require("express");
const cors = require("cors");
const path = require("path");
const chatRoutes = require("./routes/chatRoutes");
const liveChatRoutes = require("./routes/liveChatRoutes");
const nursesRoutes = require("./routes/nursesRoutes");
const requestsRoutes = require("./routes/requestsRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const authRoutes = require("./routes/authRoutes");
const trainingRoutes = require("./routes/trainingRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const assignmentController = require("./controllers/assignmentController");
const userRoutes = require("./routes/userRoutes");
const infoRoutes = require("./routes/informationRoutes");
const roleRoutes = require("./routes/roleRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const orientationRoutes = require("./routes/orientationRoutes");
const jobDocumentRoutes = require("./routes/jobDocumentRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const miscRoutes = require("./routes/miscRoutes");
const licenseRoutes = require("./routes/licenseRoutes");








const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Frontend URL
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
=======
// Socket.io Logic
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a personal room based on user_id for notifications
    socket.on("join_user_room", (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${socket.id} joined personal room: user_${userId}`);
    });

    socket.on("send_message", (data) => {
        // Broadcast to the recipient's personal room
        io.to(`user_${data.recipient_id}`).emit("receive_message", data);
        // Also broadcast back to sender's other tabs/devices
        io.to(`user_${data.sender_id}`).emit("receive_message", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});
>>>>>>> 37000de (Bushra update)

// test
app.get("/", (req, res) => {
    res.send("Server is working ✅");
});

app.use("/api/chat", chatRoutes);
app.use("/api/live-chat", liveChatRoutes);
// nurses API
app.get("/api/nurses/available", assignmentController.getAvailableNurses);
app.use("/api/nurses", nursesRoutes);
// assignments API
app.use("/api/assignments", assignmentRoutes);
// requests API
app.use("/api/requests", requestsRoutes);
// approval API
app.use("/api/approvals", approvalRoutes);
// auth API
app.use("/api/auth", authRoutes);
//training API
app.use("/api/training", trainingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/information", infoRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/uploads", uploadRoutes);

<<<<<<< HEAD
app.use("/api/orientation", orientationRoutes);

app.use("/api/job", jobDocumentRoutes);

app.use("/api/evaluation", evaluationRoutes);

app.use("/api/misc", miscRoutes);

app.use("/api/licenses", licenseRoutes);




=======
>>>>>>> 37000de (Bushra update)
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
