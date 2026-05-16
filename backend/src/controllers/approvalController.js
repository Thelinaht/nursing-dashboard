
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
                }, req.app.get("io"));
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
            }, req.app.get("io"));

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

        // Fetch request details for notifications
        const reqData = await requestModel.getRequestById(request_id);

        if (reqData) {
            const nurseId = reqData.nurse_id;
            const statusLabel = decision === "Approved" ? "Approved ✅" : "Rejected ❌";
            const notificationType = decision === "Approved" ? "success" : "error";

            // 1. Notify the Nurse
            await notificationController.createNotification({
                user_id: nurseId,
                title: `Request ${decision}`,
                message: `Your request #${request_id} has been ${decision.toLowerCase()} by the Director.`,
                notification_type: notificationType,
                priority: "high",
                category: "Requests"
            }, req.app.get("io"));

            // 2. Notify the Supervisor (User ID 20)
            // They need to know the final outcome of the request they previously approved
            await notificationController.createNotification({
                user_id: 20,
                title: `Director Decision: ${decision}`,
                message: `The Director has ${decision.toLowerCase()} Request #${request_id} (submitted by ${reqData.full_name}).`,
                notification_type: notificationType,
                priority: "medium",
                category: "Requests"
            }, req.app.get("io"));
        }

        if (req.app.get("io")) req.app.get("io").emit("request_updated");
        res.json({ message: `Final decision (${decision}) applied by Director and notifications sent ✅` });

    } catch (err) {
        console.error("Director decision error:", err);
        res.status(500).json({ error: err.message });
    }
};