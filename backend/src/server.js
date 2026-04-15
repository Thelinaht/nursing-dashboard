const express = require("express");
const cors = require("cors");

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



const app = express();

app.use(cors());
app.use(express.json());

// test
app.get("/", (req, res) => {
    res.send("Server is working ✅");
});

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



const PORT = 4000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



