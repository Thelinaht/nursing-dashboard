const model = require("../models/requestsModel");
const approvalModel = require("../models/approvalModel");
const notificationController = require("./notificationController");

exports.getAll = async (req, res) => {
    try {
        const data = await model.getAllRequests();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getByNurseId = async (req, res) => {
    try {
        const data = await model.getRequestsByNurseId(req.params.nurse_id);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const data = await model.getRequestById(req.params.id);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};


exports.create = async (req, res) => {
    try {
        const result = await model.createRequest(req.body);

        const request_id = result.insertId;

        await approvalModel.createApproval(request_id, "Supervisor");

        // Trigger real-time live reload on all dashboards
        if (req.app.get("io")) {
            req.app.get("io").emit("request_updated");
        }

        // 1. Notify Supervisor (User ID 20 based on previous DB check)
        // Note: In production, query the actual supervisor ID dynamically
        await notificationController.createNotification({
            user_id: 20,
            title: "New Request Submitted",
            message: `A new ${req.body.request_type || 'request'} has been submitted and is pending your review.`,
            notification_type: "info",
            priority: "medium",
            category: "Requests"
        }, req.app.get("io"));

        // 2. Notify the Nurse (Confirmation)
        await notificationController.createNotification({
            user_id: req.body.nurse_id,
            title: "Request Submitted Successfully",
            message: `Your ${req.body.request_type || 'request'} has been submitted and is awaiting supervisor review.`,
            notification_type: "success",
            priority: "low",
            category: "Requests"
        }, req.app.get("io"));

        res.json(result);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};



exports.updateStatus = async (req, res) => {
    try {
        const result = await model.updateStatus(
            req.params.id,
            req.body.status
        );
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const result = await model.deleteRequest(req.params.id);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
// GET requests filtered by unit (for supervisor)
exports.getByUnit = async (req, res) => {
    try {
        const { unit } = req.query;
        if (!unit) {
            const data = await model.getAllRequests();
            return res.json(data);
        }
        const data = await model.getRequestsByUnit(unit);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};