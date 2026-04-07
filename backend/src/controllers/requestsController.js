const model = require("../models/requestsModel");
const approvalModel = require("../models/approvalModel");

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