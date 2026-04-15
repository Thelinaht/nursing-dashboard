const roleModel = require("../models/roleModel");

const getRoles = async (req, res) => {
    try {
        const roles = await roleModel.getAllRoles();
        res.json(roles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    getRoles
};