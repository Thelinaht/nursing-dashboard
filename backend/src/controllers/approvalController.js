const approvalModel = require("../models/approvalModel");
const requestModel = require("../models/requestsModel");



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
        //  قرار السوبرفايزر
        await approvalModel.makeDecision(request_id, "Supervisor", decision);

        if (decision === "Rejected") {
            //  ينتهي الطلب
            await requestModel.updateRequestStatus(request_id, "Rejected");

            return res.json({ message: "Request rejected by Supervisor ❌" });
        }

        if (decision === "Approved") {
            //  يروح للمرحلة الثانية
            await approvalModel.createApproval(request_id, "Assistant Director");

            return res.json({ message: "Moved to Assistant Director ✅" });
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
            return res.json({ message: "Request rejected by Assistant Director ❌" });
        }

        if (decision === "Approved") {
            // Move to final stage: Director
            await approvalModel.createApproval(request_id, "Director");
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

        // Final decision applied to the request
        await requestModel.updateRequestStatus(request_id, decision);

        res.json({ message: `Final decision (${decision}) applied by Director ✅` });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};