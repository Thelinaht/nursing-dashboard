const approvalModel = require("../models/approvalModel");
const requestModel = require("../models/requestsModel");
const notificationController = require("./notificationController");



exports.getAll = async (req, res) => {
    try {
        const data = await approvalModel.getAllApprovals();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};




// Supervisor decision
exports.supervisorDecision = async (req, res) => {
    const { request_id, decision } = req.body;

    try {
        await approvalModel.makeDecision(request_id, "Supervisor", decision);

        if (decision === "Rejected") {
            await requestModel.updateRequestStatus(request_id, "Rejected");
            if (req.app.get("io")) req.app.get("io").emit("request_updated");

            // Notify the nurse
            const reqData = await requestModel.getRequestById(request_id);
            if (reqData && reqData.nurse_id) {
                await notificationController.createNotification({
                    user_id: reqData.nurse_id,
                    title: "Request Rejected",
                    message: `Your request #${request_id} has been rejected by the Supervisor.`,
                    notification_type: "error",
                    priority: "high"
                });
            }

            return res.json({ message: "Request rejected by Supervisor ❌" });
        }

        if (decision === "Approved") {
            await approvalModel.createApproval(request_id, "Director");
            await requestModel.updateRequestStatus(request_id, "Pending_Director");
            if (req.app.get("io")) req.app.get("io").emit("request_updated");

            // Notify Director (User ID 36)
            await notificationController.createNotification({
                user_id: 36,
                title: "New Approval Required",
                message: `Request #${request_id} has been approved by the Supervisor and awaits your final decision.`,
                notification_type: "warning",
                priority: "high"
            });

            return res.json({ message: "Moved to Director ✅" });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Assistant decision
exports.assistantDecision = async (req, res) => {
    const { request_id, decision } = req.body;

    try {
        await approvalModel.makeDecision(request_id, "Assistant Director", decision);

        if (decision === "Rejected") {
            await requestModel.updateRequestStatus(request_id, "Rejected");
            if (req.app.get("io")) req.app.get("io").emit("request_updated");
            return res.json({ message: "Request rejected by Assistant Director ❌" });
        }

        if (decision === "Approved") {
            await approvalModel.createApproval(request_id, "Director");
            if (req.app.get("io")) req.app.get("io").emit("request_updated");
            return res.json({ message: "Moved to Director ✅" });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Director decision (Final)
exports.directorDecision = async (req, res) => {
    const { request_id, decision } = req.body;

    try {
        await approvalModel.makeDecision(request_id, "Director", decision);

        await requestModel.updateRequestStatus(request_id, decision);

        if (req.app.get("io")) req.app.get("io").emit("request_updated");
        res.json({ message: `Final decision (${decision}) applied by Director ✅` });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};