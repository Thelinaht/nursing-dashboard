const surveyModel = require("../models/surveyModel");
const notificationController = require("./notificationController");

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

// GET /api/surveys/periods?role_id=4
const getPeriods = async (req, res) => {
    try {
        const role_id = Number(req.query.role_id);
        if (role_id !== 4) {
            return res.status(403).json({ message: "Access denied" });
        }
        const periods = await surveyModel.getAllPeriods();
        res.json({ periods });
    } catch (err) {
        console.error("getPeriods error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/surveys/periods
// body: { role_id, year, survey_type, opens_at, closes_at, is_active }
const createPeriod = async (req, res) => {
    try {
        const { role_id, year, survey_type, opens_at, closes_at, is_active } = req.body;
        if (Number(role_id) !== 4) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (!year || !survey_type || !opens_at || !closes_at) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const periodId = await surveyModel.createPeriod(year, survey_type, opens_at, closes_at, is_active);
        
        // Role-based notification to Nurses and Supervisors if active
        if (is_active) {
            const io = req.app.get("io");
            await notificationController.createNotificationForRoles({
                title: "New Survey Period Open",
                message: `The ${survey_type} survey for year ${year} is now open for responses.`,
                notification_type: 'info',
                priority: 'medium',
                category: "Survey"
            }, [1, 3], io);
        }

        res.json({ message: "Period created successfully", periodId });
    } catch (err) {
        console.error("createPeriod error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/surveys/periods/:id
// body: { role_id, year, survey_type, opens_at, closes_at, is_active }
const updatePeriod = async (req, res) => {
    try {
        const periodId = req.params.id;
        const { role_id, year, survey_type, opens_at, closes_at, is_active } = req.body;
        if (Number(role_id) !== 4) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (!year || !survey_type || !opens_at || !closes_at) {
            return res.status(400).json({ message: "All fields are required" });
        }
        await surveyModel.updatePeriod(periodId, year, survey_type, opens_at, closes_at, is_active);

        // Role-based notification to Nurses and Supervisors if active
        if (is_active) {
            const io = req.app.get("io");
            await notificationController.createNotificationForRoles({
                title: "Survey Period Updated",
                message: `The ${survey_type} survey for year ${year} is currently open for responses.`,
                notification_type: 'info',
                priority: 'medium',
                category: "Survey"
            }, [1, 3], io);
        }

        res.json({ message: "Period updated successfully" });
    } catch (err) {
        console.error("updatePeriod error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/surveys/periods/:id?role_id=4
const deletePeriod = async (req, res) => {
    try {
        const periodId = req.params.id;
        const role_id = Number(req.query.role_id);
        if (role_id !== 4) {
            return res.status(403).json({ message: "Access denied" });
        }
        await surveyModel.deletePeriod(periodId);
        res.json({ message: "Period deleted successfully" });
    } catch (err) {
        console.error("deletePeriod error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { 
    getPending, 
    submit, 
    getResults,
    getPeriods,
    createPeriod,
    updatePeriod,
    deletePeriod
};