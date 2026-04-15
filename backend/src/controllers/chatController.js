const {
    getNurseProfileByUserId,
    getUserAccountByUserId,
    getLatestTrainingByUserId,
    getLatestLicenseByUserId,
    getLatestRequestByUserId,
    getUnreadNotificationsByUserId,
    getLatestNotificationsByUserId,
} = require("../models/chatModel");

function formatDate(value) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-GB");
}

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;

    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }

    return age;
}

function normalizeText(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function includesAny(text, words) {
    return words.some((word) => text.includes(word));
}

function detectEntity(text) {
    if (
        includesAny(text, [
            "license",
            "licence",
            "expiry",
            "issuing authority",
            "issue date",
            "license number",
            "registration",
        ])
    ) {
        return "license";
    }

    if (
        includesAny(text, [
            "training",
            "trainings",
            "course",
            "courses",
            "mandatory",
            "preceptor",
            "certificate",
            "due date",
            "completion date",
            "expiry of training",
        ])
    ) {
        return "training";
    }

    if (
        includesAny(text, [
            "request",
            "requests",
            "leave",
            "application",
            "approval",
            "request type",
            "request status",
            "latest request",
        ])
    ) {
        return "request";
    }

    if (
        includesAny(text, [
            "notification",
            "notifications",
            "alert",
            "alerts",
            "unread",
            "priority",
            "latest notifications",
        ])
    ) {
        return "notification";
    }

    if (
        includesAny(text, [
            "email",
            "account",
            "account status",
            "user account",
            "created at",
            "created date",
        ])
    ) {
        return "user";
    }

    return "profile";
}

function detectOperation(text) {
    if (
        includesAny(text, [
            "how many",
            "count",
            "number of",
            "total",
        ])
    ) {
        return "count";
    }

    if (
        includesAny(text, [
            "latest",
            "last",
            "most recent",
            "newest",
        ])
    ) {
        return "latest";
    }

    if (
        includesAny(text, [
            "show",
            "list",
            "display",
            "all",
            "records",
            "details",
        ])
    ) {
        return "list";
    }

    return "value";
}

function extractProfileField(text) {
    if (includesAny(text, ["age", "how old am i", "my age"])) return "age";
    if (includesAny(text, ["full name", "name", "who am i"])) return "full_name";
    if (includesAny(text, ["first name"])) return "first_name";
    if (includesAny(text, ["last name"])) return "last_name";
    if (includesAny(text, ["national id", "iqama", "national id iqama"])) return "national_id_iqama";
    if (includesAny(text, ["hospital id", "hospital number"])) return "hospital_id_number";
    if (includesAny(text, ["gender"])) return "gender";
    if (includesAny(text, ["nationality"])) return "nationality";
    if (includesAny(text, ["birth date", "date of birth", "dob"])) return "birth_date_gregorian";
    if (includesAny(text, ["mobile", "phone", "mobile number"])) return "mobile_number";
    if (includesAny(text, ["iau email"])) return "iau_email";
    if (includesAny(text, ["unit"])) return "unit";
    if (includesAny(text, ["department"])) return "department";
    if (includesAny(text, ["job title", "job"])) return "job_title";
    if (includesAny(text, ["position", "position title"])) return "position_title";
    if (includesAny(text, ["status"])) return "status";
    if (includesAny(text, ["hire date", "hired"])) return "hire_date";
    if (includesAny(text, ["experience", "years of experience"])) return "years_of_experience";
    if (includesAny(text, ["shift", "shift type"])) return "shift_type";
    return null;
}

function extractUserField(text) {
    if (includesAny(text, ["account email", "login email"])) return "email";
    if (includesAny(text, ["account status"])) return "account_status";
    if (includesAny(text, ["created at", "created date", "account created"])) return "created_at";
    return null;
}

function extractLicenseField(text) {
    if (includesAny(text, ["license number", "number"])) return "license_number";
    if (includesAny(text, ["issue date"])) return "issue_date";
    if (includesAny(text, ["expiry", "expire", "expiry date"])) return "expiry_date";
    if (includesAny(text, ["issuing authority", "issuer"])) return "issuing_authority";
    return null;
}

function extractTrainingField(text) {
    if (includesAny(text, ["training name", "course name", "name"])) return "training_name";
    if (includesAny(text, ["category"])) return "training_category";
    if (includesAny(text, ["type"])) return "training_type";
    if (includesAny(text, ["duration", "hours"])) return "duration_hours";
    if (includesAny(text, ["facility"])) return "facility_name";
    if (includesAny(text, ["unit of training"])) return "unit_of_training";
    if (includesAny(text, ["mandatory"])) return "mandatory";
    if (includesAny(text, ["status"])) return "status";
    if (includesAny(text, ["start date"])) return "start_date";
    if (includesAny(text, ["completion date", "completed"])) return "completion_date";
    if (includesAny(text, ["due date"])) return "due_date";
    if (includesAny(text, ["expiry"])) return "expiry_date";
    if (includesAny(text, ["preceptor"])) return "preceptor_name";
    if (includesAny(text, ["certificate"])) return "certificate_file_path";
    return null;
}

function extractRequestField(text) {
    if (includesAny(text, ["request type", "type"])) return "request_type";
    if (includesAny(text, ["title"])) return "title";
    if (includesAny(text, ["description"])) return "description";
    if (includesAny(text, ["submission date", "submitted"])) return "submission_date";
    if (includesAny(text, ["status", "current status"])) return "current_status";
    return null;
}

function extractNotificationField(text) {
    if (includesAny(text, ["title"])) return "title";
    if (includesAny(text, ["message"])) return "message";
    if (includesAny(text, ["type"])) return "notification_type";
    if (includesAny(text, ["priority"])) return "priority";
    if (includesAny(text, ["category"])) return "category";
    if (includesAny(text, ["created", "date"])) return "created_at";
    return null;
}

function formatValue(field, value) {
    if (value === null || value === undefined || value === "") return "N/A";

    const dateFields = [
        "birth_date_gregorian",
        "hire_date",
        "created_at",
        "issue_date",
        "expiry_date",
        "start_date",
        "completion_date",
        "due_date",
        "submission_date",
    ];

    if (dateFields.includes(field)) {
        return formatDate(value);
    }

    if (field === "mandatory") {
        return value ? "Yes" : "No";
    }

    return String(value);
}

async function handleProfile(text, userId, res) {
    const profile = await getNurseProfileByUserId(userId);

    if (!profile) {
        return res.json({ reply: "I could not find your profile information." });
    }

    const field = extractProfileField(text);

    if (field === "age") {
        const age = calculateAge(profile.birth_date_gregorian);

        return res.json({
            reply:
                age !== null
                    ? `Your age is ${age}.`
                    : "I could not calculate your age because your birth date is not available.",
        });
    }

    if (field) {
        return res.json({
            reply: `Your ${field.replace(/_/g, " ")} is ${formatValue(field, profile[field])}.`,
        });
    }

    return res.json({
        reply: `Your name is ${profile.full_name}. You work as ${profile.job_title || "N/A"} in ${profile.department || "N/A"}, unit ${profile.unit || "N/A"}, and your position is ${profile.position_title || "N/A"}. Your current status is ${profile.status || "N/A"}.`,
    });
}

async function handleUser(text, userId, res) {
    const user = await getUserAccountByUserId(userId);

    if (!user) {
        return res.json({ reply: "I could not find your user account information." });
    }

    const field = extractUserField(text);

    if (field) {
        return res.json({
            reply: `Your ${field.replace(/_/g, " ")} is ${formatValue(field, user[field])}.`,
        });
    }

    return res.json({
        reply: `Your account email is ${user.email || "N/A"}, account status is ${user.account_status || "N/A"}, and account creation date is ${formatDate(user.created_at)}.`,
    });
}

async function handleLicense(text, userId, res) {
    const license = await getLatestLicenseByUserId(userId);

    if (!license) {
        return res.json({ reply: "I could not find your license information." });
    }

    const field = extractLicenseField(text);

    if (field) {
        return res.json({
            reply: `Your ${field.replace(/_/g, " ")} is ${formatValue(field, license[field])}.`,
        });
    }

    return res.json({
        reply: `Your license number is ${license.license_number}. It was issued by ${license.issuing_authority || "N/A"}, issue date ${formatDate(license.issue_date)}, and expiry date ${formatDate(license.expiry_date)}.`,
    });
}

async function handleTraining(text, operation, userId, res) {
    const rows = await getLatestTrainingByUserId(userId, operation === "list" ? 5 : 3);

    if (!rows.length) {
        return res.json({ reply: "No training records were found for your account." });
    }

    const field = extractTrainingField(text);

    if (field && operation === "value") {
        const latest = rows[0];
        return res.json({
            reply: `Your latest training ${field.replace(/_/g, " ")} is ${formatValue(field, latest[field])}.`,
        });
    }

    const summary = rows
        .map((item, index) => {
            return `${index + 1}. ${item.training_name} - ${item.status} (Due: ${formatDate(item.due_date)}, Expiry: ${formatDate(item.expiry_date)})`;
        })
        .join(" ");

    return res.json({
        reply: `Here are your latest training records: ${summary}`,
    });
}

async function handleRequest(text, userId, res) {
    const request = await getLatestRequestByUserId(userId);

    if (!request) {
        return res.json({ reply: "I could not find any recent requests." });
    }

    const field = extractRequestField(text);

    if (field) {
        return res.json({
            reply: `Your latest request ${field.replace(/_/g, " ")} is ${formatValue(field, request[field])}.`,
        });
    }

    return res.json({
        reply: `Your latest request is "${request.request_type}". Title: "${request.title || "N/A"}". Current status: ${request.current_status}. Submission date: ${formatDate(request.submission_date)}.`,
    });
}

async function handleNotification(text, operation, userId, res) {
    if (operation === "count" || includesAny(text, ["unread"])) {
        const unreadCount = await getUnreadNotificationsByUserId(userId);
        return res.json({
            reply: `You currently have ${unreadCount} unread notifications.`,
        });
    }

    const notifications = await getLatestNotificationsByUserId(userId, operation === "list" ? 5 : 3);

    if (!notifications.length) {
        return res.json({ reply: "You do not have any notifications right now." });
    }

    const field = extractNotificationField(text);

    if (field && operation === "value") {
        const latest = notifications[0];
        return res.json({
            reply: `Your latest notification ${field.replace(/_/g, " ")} is ${formatValue(field, latest[field])}.`,
        });
    }

    const summary = notifications
        .map((item, index) => `${index + 1}. ${item.title} - ${item.priority} priority`)
        .join(" ");

    return res.json({
        reply: `Your latest notifications are: ${summary}`,
    });
}

async function sendChatMessage(req, res) {
    try {
        const { message, userId, role } = req.body;

        if (!message || !userId) {
            return res.status(400).json({
                reply: "Message and user ID are required.",
            });
        }

        const text = normalizeText(message);
        const entity = detectEntity(text);
        const operation = detectOperation(text);

        if (entity === "profile") {
            return await handleProfile(text, userId, res);
        }

        if (entity === "user") {
            return await handleUser(text, userId, res);
        }

        if (entity === "license") {
            return await handleLicense(text, userId, res);
        }

        if (entity === "training") {
            return await handleTraining(text, operation, userId, res);
        }

        if (entity === "request") {
            return await handleRequest(text, userId, res);
        }

        if (entity === "notification") {
            return await handleNotification(text, operation, userId, res);
        }

        if (role === "secretary") {
            return res.json({
                reply: "I can help with account information, staff profile details, training, licenses, requests, and notifications. Try asking in a full sentence.",
            });
        }

        if (role === "supervisor") {
            return res.json({
                reply: "I can help with account information, staff profile details, training, licenses, requests, and notifications. Try asking in a full sentence.",
            });
        }

        return res.json({
            reply: "I’m not fully sure what you need yet. Try asking something like: what is my email, what is my hospital id, when does my license expire, show my training, what is my latest request, or how many unread notifications do I have.",
        });
    } catch (error) {
        console.error("Chat controller error:", error);
        return res.status(500).json({
            reply: "Something went wrong while reading your data.",
        });
    }
}

module.exports = {
    sendChatMessage,
};