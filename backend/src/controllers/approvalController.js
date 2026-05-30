const approvalModel = require("../models/approvalModel");
const requestModel = require("../models/requestsModel");
const notificationController = require("./notificationController");

const getIo = (req) => req.app.get("io");

// GET all approvals
exports.getAll = async (req, res) => {
    try {
        res.json(await approvalModel.getAllApprovals());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// GET approvals trail for one request
exports.getByRequest = async (req, res) => {
    try {
        res.json(await approvalModel.getApprovalsByRequestId(req.params.request_id));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// ── SUPERVISOR DECISION ───────────────────────────────────────────────────────
// Always forwards to Assistant Director regardless of decision
exports.supervisorDecision = async (req, res) => {
    const { request_id, decision, comment } = req.body;
    try {
        const reqData = await requestModel.getRequestById(request_id);
        if (!reqData) return res.status(404).json({ error: "Request not found" });

        await approvalModel.makeDecision(request_id, "Supervisor", decision, comment);

        // Always forward to Assistant Director
        await requestModel.updateRequestStatus(request_id, "Pending_Assistant");
        await approvalModel.createApproval(request_id, "Assistant Director");

        const io = getIo(req);
        if (io) io.emit("request_updated");

        // Notify Assistant Director (role_id = 8)
        const [assistants] = await require("../db").query(
            `SELECT u.user_id FROM User u
             JOIN UserRole ur ON u.user_id = ur.user_id
             WHERE ur.role_id = 8 AND u.account_status = 'Active'`
        );
        for (const a of assistants) {
            await notificationController.createNotification({
                user_id: a.user_id,
                title: "New Request Awaiting Your Review",
                message: `Request #${request_id} from ${reqData.full_name} has been reviewed by the Supervisor (${decision.replace("_", " ")}) and needs your review.`,
                notification_type: "info",
                priority: "high",
                category: "Requests"
            }, io);
        }

        // NO nurse notification at this stage

        res.json({ message: `Supervisor decision (${decision}) recorded, forwarded to Assistant Director` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ── ASSISTANT DIRECTOR DECISION ───────────────────────────────────────────────
// Always forwards to Director regardless of decision
exports.assistantDecision = async (req, res) => {
    const { request_id, decision, comment } = req.body;
    try {
        const reqData = await requestModel.getRequestById(request_id);
        if (!reqData) return res.status(404).json({ error: "Request not found" });

        await approvalModel.makeDecision(request_id, "Assistant Director", decision, comment);

        // Always forward to Director
        await requestModel.updateRequestStatus(request_id, "Pending_Director");
        await approvalModel.createApproval(request_id, "Director");

        const io = getIo(req);
        if (io) io.emit("request_updated");

        // Notify Director (role_id = 4)
        const [directors] = await require("../db").query(
            `SELECT u.user_id FROM User u
             JOIN UserRole ur ON u.user_id = ur.user_id
             WHERE ur.role_id = 4 AND u.account_status = 'Active'`
        );
        for (const d of directors) {
            await notificationController.createNotification({
                user_id: d.user_id,
                title: "New Request Awaiting Final Decision",
                message: `Request #${request_id} from ${reqData.full_name} needs your final decision.`,
                notification_type: "info",
                priority: "high",
                category: "Requests"
            }, io);
        }

        // NO nurse notification at this stage

        res.json({ message: `Assistant Director decision (${decision}) recorded, forwarded to Director` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ── DIRECTOR DECISION (FINAL) ─────────────────────────────────────────────────
// Only here does the nurse get notified
exports.directorDecision = async (req, res) => {
    const { request_id, decision, comment } = req.body;
    try {
        const reqData = await requestModel.getRequestById(request_id);
        if (!reqData) return res.status(404).json({ error: "Request not found" });

        await approvalModel.makeDecision(request_id, "Director", decision, comment);
        await requestModel.updateRequestStatus(request_id, decision);

        const io = getIo(req);
        const db = require("../db");

        const notifType = decision === "Approved" ? "success" : decision === "For_Discussion" ? "warning" : "error";
        const decisionLabel = decision.replace("_", " ");

        // Notify nurse — ONLY final decision with director's comment
        await notificationController.createNotification({
            user_id: reqData.nurse_user_id,
            title: `Final Decision: ${decisionLabel}`,
            message: `Your request #${request_id} has received a final decision: ${decisionLabel}.${comment ? ` Director's comment: "${comment}"` : ""}`,
            notification_type: notifType,
            priority: "high",
            category: "Requests"
        }, io);

        if (io) io.emit("request_updated");
        res.json({ message: `Final decision (${decision}) recorded, nurse notified` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};