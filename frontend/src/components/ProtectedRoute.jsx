import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute
 *
 * Props:
 *   allowedRoles  — array of role_id numbers allowed to visit this route.
 *                   If omitted, any logged-in user may access the route.
 *   children      — the page component to render when access is granted.
 *
 * Behaviour:
 *   1. No session  → redirect to /  (login page)
 *   2. Wrong role  → redirect to their own dashboard
 *   3. Correct     → render children
 */

// Map each role_id to its home dashboard path
const ROLE_HOME = {
    1: "/nurse-dashboard",
    2: "/secretary-dashboard",
    3: "/supervisor-dashboard",
    4: "/director-dashboard",
    5: "/quality-manager-dashboard",
    6: "/training-director-dashboard",
    7: "/researcher-dashboard",
    8: "/patient-services-dashboard",
};

export default function ProtectedRoute({ allowedRoles, children }) {
    // Read session
    const raw = sessionStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;

    // 1. Not logged in → go to login
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // 2. Role restriction exists and user's role isn't in it → send them home
    if (allowedRoles && !allowedRoles.includes(user.role_id)) {
        const home = ROLE_HOME[user.role_id] || "/";
        return <Navigate to={home} replace />;
    }

    // 3. All good
    return children;
}