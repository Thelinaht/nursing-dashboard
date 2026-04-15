// Example of checking role in backend when user logs in (part of the authentication logic)

const getUserRole = async (email, password) => {
    const user = await User.findOne({ where: { email } });
    if (user && bcrypt.compareSync(password, user.password_hash)) {
        // Checking for roles
        const role = await Role.findByPk(user.role_id); // Assuming role_id is set correctly

        return {
            user,
            role_name: role.role_name,  // "nurse", "director", "supervisor", etc.
        };
    }
    return null;
};