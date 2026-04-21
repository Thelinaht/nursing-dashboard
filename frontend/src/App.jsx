import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import NurseDashboard from "./pages/NurseDashboard";
import SecretaryDashboard from "./pages/SecretaryDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import ManageRequests from "./pages/ManageRequests";
import AssignStaff from "./pages/AssignStaff";
import StaffDetails from "./pages/StaffDetails";
import StaffProfile from "./pages/StaffProfile";
import StaffQualification from "./pages/StaffQualification";
import StaffOrientation from "./pages/StaffOrientation";
import RequestPage from "./pages/RequestPage.jsx";
import JobInformation from "./pages/JobInformation";
import StaffEvaluation from "./pages/StaffEvaluation";
import StaffMiscellaneous from "./pages/StaffMiscellaneous";
import LicenseTracker from "./pages/LicenseTracker";




// dashboards / admin
import AddNurse from "./pages/AddNurse";
import DirectorDashboard from "./pages/DirectorDashboard";
import QualityManagerDashboard from "./pages/QualityManagerDashboard";

// requests system
import LeaveRequest from "./pages/LeaveRequest";
import ShiftSwap from "./pages/ShiftSwap";
import DocumentUpdate from "./pages/DocumentUpdate";
import UnitTransfer from "./pages/UnitTransfer";
import TrainingRequest from "./pages/TrainingRequest";
import GeneralRequest from "./pages/GeneralRequest";
import RequestHistory from "./pages/RequestHistory";
import TrainingPage from "./pages/TrainingPage";
import StaffDirectory from "./pages/StaffDirectory";

function App() {
        return (
                <Router>
                        <Routes>
                                <Route path="/" element={<Login />} />

                                {/* dashboards */}
                                <Route path="/nurse-dashboard" element={<NurseDashboard />} />
                                <Route path="/nurse-info" element={<NurseDashboard />} />
                                <Route path="/secretary-dashboard" element={<SecretaryDashboard />} />
                                <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />
                                <Route path="/supervisor/manage-requests" element={<ManageRequests />} />
                                <Route path="/director-dashboard" element={<DirectorDashboard />} />
                                <Route path="/quality-manager-dashboard" element={<QualityManagerDashboard />} />
                                <Route path="/add-nurse" element={<AddNurse />} />

                                {/* staff */}

                                <Route path="/assign-staff" element={<AssignStaff />} />
                                <Route path="/nurse/:id" element={<StaffDetails />} />
                                <Route path="/nurse/:id/profile" element={<StaffProfile />} />
                                <Route path="/nurse/:id/qualification" element={<StaffQualification />} />
                                <Route path="/nurse/:id/orientation" element={<StaffOrientation />} />
                                <Route path="/nurse/:id/job" element={<JobInformation />} />
                                <Route path="/nurse/:id/evaluation" element={<StaffEvaluation />} />
                                <Route path="/nurse/:id/misc" element={<StaffMiscellaneous />} />
                                <Route path="/licenses" element={<LicenseTracker />} />


                                {/* requests */}
                                <Route path="/request" element={<RequestPage />} />
                                <Route path="/request/leave" element={<LeaveRequest />} />
                                <Route path="/request/shift-swap" element={<ShiftSwap />} />
                                <Route path="/request/document-update" element={<DocumentUpdate />} />
                                <Route path="/request/unit-transfer" element={<UnitTransfer />} />
                                <Route path="/request/training" element={<TrainingRequest />} />
                                <Route path="/request/general" element={<GeneralRequest />} />
                                <Route path="/request/history" element={<RequestHistory />} />

                                {/* training */}
                                <Route path="/training" element={<TrainingPage />} />
                                <Route path="/staff" element={<StaffDirectory />} />
                        </Routes>
                </Router>
        );
}

export default App;