// controllers/userController.js
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Example of login logic
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).send("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
        return res.status(400).send("Invalid credentials");
    }

    // Creating JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, 'your_jwt_secret', {
        expiresIn: '1h',
    });

    res.json({ token, role: user.role });
};

// Example of role-based access
const getDashboard = (req, res) => {
    const { role } = req.user;

    switch (role) {
        case 'nurse':
            res.redirect('/nurse-dashboard');
            break;
        case 'secretary':
            res.redirect('/secretary-dashboard');
            break;
        case 'supervisor':
            res.redirect('/supervisor-dashboard');
            break;
        case 'director':
            res.redirect('/director-dashboard');  // Redirecting director to their dashboard
            break;
        default:
            res.status(400).send('Role not recognized');
    }
};

module.exports = {
    loginUser,
    getDashboard,
};