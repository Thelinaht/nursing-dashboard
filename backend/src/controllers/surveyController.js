const surveyModel = require("../models/surveyModel");

// GET /api/surveys/pending?user_id=37
const getPending = async (req, res) => {
    try {
        const userId = req.query.user_id;
        if (!userId) return res.status(400).json({ message: "user_id is required" });

        const pending = await surveyModel.getPendingSurveys(userId);
        res.json({ pending });
    } catch (err) {
        console.error("getPending error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/surveys/submit
// body: { user_id, period_id, responses: [{ subscale, item_index, score }] }
const submit = async (req, res) => {
    try {
        const { user_id, period_id, responses } = req.body;

        if (!user_id || !period_id || !Array.isArray(responses) || responses.length === 0) {
            return res.status(400).json({ message: "user_id, period_id and responses are required" });
        }

        const valid = responses.every(
            (r) =>
                typeof r.subscale === "string" &&
                typeof r.item_index === "number" &&
                Number.isInteger(r.score) &&
                r.score >= 1 &&
                r.score <= 5
        );
        if (!valid) {
            return res.status(400).json({ message: "Invalid response data" });
        }

        const result = await surveyModel.submitSurvey(user_id, period_id, responses);

        if (result.alreadySubmitted) {
            return res.status(409).json({ message: "Survey already submitted" });
        }

        res.json({ message: "Survey submitted successfully", submissionId: result.submissionId });
    } catch (err) {
        console.error("submit error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/surveys/results?year=2025&type=pes_nwi&role_id=4  (Director only)
const getResults = async (req, res) => {
    try {
        const role_id = Number(req.query.role_id);
        if (role_id !== 4) {
            return res.status(403).json({ message: "Access denied" });
        }

        const year = req.query.year || new Date().getFullYear();
        const surveyType = req.query.type;

        if (!["pes_nwi", "rn_satisfaction"].includes(surveyType)) {
            return res.status(400).json({ message: "Invalid survey type" });
        }

        const [results, stats] = await Promise.all([
            surveyModel.getAggregatedResults(year, surveyType),
            surveyModel.getCompletionStats(year, surveyType),
        ]);

        res.json({ results, stats, year, surveyType });
    } catch (err) {
        console.error("getResults error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getPending, submit, getResults };