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
        //  قرار الاسستنت
        await approvalModel.makeDecision(request_id, "Assistant Director", decision);

        // القرار النهائي
        await requestModel.updateRequestStatus(request_id, decision);

        res.json({ message: "Final decision applied ✅" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};