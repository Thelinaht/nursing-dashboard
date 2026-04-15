import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import NurseDashboard from "./pages/NurseDashboard";
import SecretaryDashboard from "./pages/SecretaryDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import AssignStaff from "./pages/AssignStaff";
import StaffDetails from "./pages/StaffDetails";
import StaffProfile from "./pages/StaffProfile";
import StaffQualification from "./pages/StaffQualification";
import RequestPage from "./pages/RequestPage.jsx";
import AddNurse from "./pages/AddNurse";
import DirectorDashboard from "./pages/DirectorDashboard";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/nurse-dashboard" element={<NurseDashboard />} />
        <Route path="/nurse-info" element={<NurseDashboard />} />
        <Route path="/secretary-dashboard" element={<SecretaryDashboard />} />
        <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />
        <Route path="/assign-staff" element={<AssignStaff />} />
        <Route path="/nurse/:id" element={<StaffDetails />} />
        <Route path="/nurse/:id/profile" element={<StaffProfile />} />
        <Route path="/nurse/:id/qualification" element={<StaffQualification />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/add-nurse" element={<AddNurse />} />
        <Route path="/director-dashboard" element={<DirectorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

