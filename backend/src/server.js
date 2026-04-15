const express = require("express");
const cors = require("cors");
const chatRoutes = require("./routes/chatRoutes");
const nursesRoutes = require("./routes/nursesRoutes");
const requestsRoutes = require("./routes/requestsRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const authRoutes = require("./routes/authRoutes");
const trainingRoutes = require("./routes/trainingRoutes");


const app = express();

app.use(cors());
app.use(express.json());

// test
app.get("/", (req, res) => {
    res.send("Server is working ✅");
});

app.use("/api/chat", chatRoutes);

// nurses API
app.use("/api/nurses", nursesRoutes);

// requests API
app.use("/api/requests", requestsRoutes);

// approval API
app.use("/api/approvals", approvalRoutes);

// auth API
app.use("/api/auth", authRoutes);

//training API
app.use("/api/training", trainingRoutes);

const PORT = 4000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});





