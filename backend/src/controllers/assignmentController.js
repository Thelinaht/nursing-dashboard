const assignmentModel = require("../models/assignmentModel");

exports.getAssignments = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const assignments = await assignmentModel.getAssignmentsByDate(date);
        res.json(assignments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error retrieving assignments." });
    }
};

exports.getAvailableNurses = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const availability = await assignmentModel.getNursesAvailability(date);
        res.json(availability);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error retrieving nurse availability." });
    }
};

exports.upsertAssignment = async (req, res) => {
    try {
        const { nurse_id, unit, shift, assignment_date } = req.body;
        if (!nurse_id || !unit || !shift || !assignment_date) {
            return res.status(400).json({ message: "All fields are required (nurse_id, unit, shift, assignment_date)." });
        }
        
        const result = await assignmentModel.createOrUpdateAssignment(nurse_id, unit, shift, assignment_date);
        res.status(201).json({ message: "Assignment successful", data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error creating assignment." });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await assignmentModel.deleteAssignment(id);
        
        if (success) {
            res.json({ message: "Assignment deleted successfully." });
        } else {
            res.status(404).json({ message: "Assignment not found." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error deleting assignment." });
    }
};
