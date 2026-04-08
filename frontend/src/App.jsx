
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import NurseDashboard from "./pages/NurseDashboard";
import SecretaryDashboard from "./pages/SecretaryDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import NurseDetails from "./pages/NurseDetails";
import NurseProfile from "./pages/NurseProfile";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/nurse-dashboard" element={<NurseDashboard />} />
        <Route path="/secretary-dashboard" element={<SecretaryDashboard />} />
        <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />
        <Route path="/nurse/:id" element={<NurseDetails />} />
        <Route path="/nurse/:id/profile" element={<NurseProfile />} />
      </Routes>
    </Router>
  );
}

export default App;

