import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

// Dashboards
import NurseDashboard from "./pages/NurseDashboard";
import SecretaryDashboard from "./pages/SecretaryDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import DirectorDashboard from "./pages/DirectorDashboard";
import QualityManagerDashboard from "./pages/QualityManagerDashboard";
import TrainingDirectorDashboard from "./pages/TrainingDirectorDashboard";
import ResearcherDashboard from "./pages/ResearcherDashboard";
import PatientServicesDashboard from "./pages/PatientServicesDashboard";

// Staff management
import AddNurse from "./pages/AddNurse";
import AssignStaff from "./pages/AssignStaff";
import ManageRequests from "./pages/ManageRequests";
import StaffDirectory from "./pages/StaffDirectory";
import TrainingStaffDirectory from "./pages/TrainingStaffDirectory";

// Staffing pages
import InpatientStaffingPage from "./pages/InpatientStaffingPage";
import AmbulatoryStaffingPage from "./pages/AmbulatoryStaffingPage";

// Staff profile tabs
import StaffDetails from "./pages/StaffDetails";
import StaffProfile from "./pages/StaffProfile";
import StaffQualification from "./pages/StaffQualification";
import StaffOrientation from "./pages/StaffOrientation";
import JobInformation from "./pages/JobInformation";
import StaffEvaluation from "./pages/StaffEvaluation";
import StaffMiscellaneous from "./pages/StaffMiscellaneous";
import LicenseTracker from "./pages/LicenseTracker";

// Requests
import RequestPage from "./pages/RequestPage.jsx";
import LeaveRequest from "./pages/LeaveRequest";
import ShiftSwap from "./pages/ShiftSwap";
import DocumentUpdate from "./pages/DocumentUpdate";
import UnitTransfer from "./pages/UnitTransfer";
import TrainingRequest from "./pages/TrainingRequest";
import GeneralRequest from "./pages/GeneralRequest";
import RequestHistory from "./pages/RequestHistory";

// Training & Notifications
import TrainingPage from "./pages/TrainingPage";
import NotificationsPage from "./pages/NotificationsPage";
import StaffParticipationDetails from "./pages/StaffParticipationDetails";
import TrainingNeedsAnalysisDetails from "./pages/TrainingNeedsAnalysisDetails";
import LearningOutcomesDetails from "./pages/LearningOutcomesDetails";

// Role IDs for readability
const NURSE = [1];
const SECRETARY = [2];
const SUPERVISOR = [3];
const DIRECTOR = [4];
const QUALITY = [5];
const TRAINING = [6];
const RESEARCHER = [7];
const PATIENT_SVC = [8];

// Roles that can view individual staff profiles/tabs
const STAFF_VIEWERS = [2, 3, 4, 6]; // secretary, supervisor, director, training director

// All authenticated users
const ALL = [1, 2, 3, 4, 5, 6, 7, 8];

function App() {
        return (
                <Router>
                        <Routes>
                                {/* ── Public ───────────────────────────────────────── */}
                                <Route path="/" element={<Login />} />
                                <Route path="/reset-password" element={<ResetPassword />} />

                                {/* ── Nurse ────────────────────────────────────────── */}
                                <Route path="/nurse-dashboard" element={
                                        <ProtectedRoute allowedRoles={NURSE}>
                                                <NurseDashboard />
                                        </ProtectedRoute>
                                } />
                                <Route path="/nurse-info" element={
                                        <ProtectedRoute allowedRoles={NURSE}>
                                                <NurseDashboard />
                                        </ProtectedRoute>
                                } />

                                {/* ── Secretary ─────────────────────────────────────── */}
                                <Route path="/secretary-dashboard" element={
                                        <ProtectedRoute allowedRoles={SECRETARY}>
                                                <SecretaryDashboard />
                                        </ProtectedRoute>
                                } />

                                {/* ── Supervisor ────────────────────────────────────── */}
                                <Route path="/supervisor-dashboard" element={
                                        <ProtectedRoute allowedRoles={SUPERVISOR}>
                                                <SupervisorDashboard />
                                        </ProtectedRoute>
                                } />
                                <Route path="/supervisor/manage-requests" element={
                                        <ProtectedRoute allowedRoles={SUPERVISOR}>
                                                <ManageRequests />
                                        </ProtectedRoute>
                                } />

                                {/* ── Director ──────────────────────────────────────── */}
                                <Route path="/director-dashboard" element={
                                        <ProtectedRoute allowedRoles={DIRECTOR}>
                                                <DirectorDashboard />
                                        </ProtectedRoute>
                                } />
                                <Route path="/inpatient-staffing" element={
                                        <ProtectedRoute allowedRoles={DIRECTOR}>
                                                <InpatientStaffingPage />
                                        </ProtectedRoute>
                                } />
                                <Route path="/ambulatory-staffing" element={
                                        <ProtectedRoute allowedRoles={DIRECTOR}>
                                                <AmbulatoryStaffingPage />
                                        </ProtectedRoute>
                                } />

                                {/* ── Quality Manager ───────────────────────────────── */}
                                <Route path="/quality-manager-dashboard" element={
                                        <ProtectedRoute allowedRoles={QUALITY}>
                                                <QualityManagerDashboard />
                                        </ProtectedRoute>
                                } />

                                {/* ── Training Director ─────────────────────────────── */}
                                <Route path="/training-director-dashboard" element={
                                        <ProtectedRoute allowedRoles={TRAINING}>
                                                <TrainingDirectorDashboard />
                                        </ProtectedRoute>
                                } />
                                <Route path="/training-staff" element={
                                        <ProtectedRoute allowedRoles={TRAINING}>
                                                <TrainingStaffDirectory />
                                        </ProtectedRoute>
                                } />
                                <Route path="/training/participation" element={
                                        <ProtectedRoute allowedRoles={TRAINING}>
                                                <StaffParticipationDetails />
                                        </ProtectedRoute>
                                } />
                                <Route path="/training/needs-analysis" element={
                                        <ProtectedRoute allowedRoles={TRAINING}>
                                                <TrainingNeedsAnalysisDetails />
                                        </ProtectedRoute>
                                } />
                                <Route path="/training/learning-outcomes" element={
                                        <ProtectedRoute allowedRoles={TRAINING}>
                                                <LearningOutcomesDetails />
                                        </ProtectedRoute>
                                } />

                                {/* ── Researcher ────────────────────────────────────── */}
                                <Route path="/researcher-dashboard" element={
                                        <ProtectedRoute allowedRoles={RESEARCHER}>
                                                <ResearcherDashboard />
                                        </ProtectedRoute>
                                } />

                                {/* ── Patient Services ──────────────────────────────── */}
                                <Route path="/patient-services-dashboard" element={
                                        <ProtectedRoute allowedRoles={PATIENT_SVC}>
                                                <PatientServicesDashboard />
                                        </ProtectedRoute>
                                } />

                                {/* ── Staff management (admin roles) ────────────────── */}
                                <Route path="/add-nurse" element={
                                        <ProtectedRoute allowedRoles={[...SECRETARY, ...DIRECTOR]}>
                                                <AddNurse />
                                        </ProtectedRoute>
                                } />
                                <Route path="/assign-staff" element={
                                        <ProtectedRoute allowedRoles={[...SUPERVISOR, ...DIRECTOR]}>
                                                <AssignStaff />
                                        </ProtectedRoute>
                                } />
                                <Route path="/staff" element={
                                        <ProtectedRoute allowedRoles={STAFF_VIEWERS}>
                                                <StaffDirectory />
                                        </ProtectedRoute>
                                } />
                                <Route path="/licenses" element={
                                        <ProtectedRoute allowedRoles={[...DIRECTOR, ...SECRETARY]}>
                                                <LicenseTracker />
                                        </ProtectedRoute>
                                } />

                                {/* ── Staff profile tabs (viewed by admin roles) ─────── */}
                                <Route path="/nurse/:id" element={
                                        <ProtectedRoute allowedRoles={STAFF_VIEWERS}>
                                                <StaffDetails />
                                        </ProtectedRoute>
                                } />
                                <Route path="/nurse/:id/profile" element={
                                        <ProtectedRoute allowedRoles={STAFF_VIEWERS}>
                                                <StaffProfile />
                                        </ProtectedRoute>
                                } />
                                <Route path="/nurse/:id/qualification" element={
                                        <ProtectedRoute allowedRoles={STAFF_VIEWERS}>
                                                <StaffQualification />
                                        </ProtectedRoute>
                                } />
                                <Route path="/nurse/:id/orientation" element={
                                        <ProtectedRoute allowedRoles={STAFF_VIEWERS}>
                                                <StaffOrientation />
                                        </ProtectedRoute>
                                } />
                                <Route path="/nurse/:id/job" element={
                                        <ProtectedRoute allowedRoles={STAFF_VIEWERS}>
                                                <JobInformation />
                                        </ProtectedRoute>
                                } />
                                <Route path="/nurse/:id/evaluation" element={
                                        <ProtectedRoute allowedRoles={STAFF_VIEWERS}>
                                                <StaffEvaluation />
                                        </ProtectedRoute>
                                } />
                                <Route path="/nurse/:id/misc" element={
                                        <ProtectedRoute allowedRoles={STAFF_VIEWERS}>
                                                <StaffMiscellaneous />
                                        </ProtectedRoute>
                                } />

                                {/* ── Requests (nurses only) ────────────────────────── */}
                                <Route path="/request" element={
                                        <ProtectedRoute allowedRoles={NURSE}>
                                                <RequestPage />
                                        </ProtectedRoute>
                                } />
                                <Route path="/request/leave" element={
                                        <ProtectedRoute allowedRoles={NURSE}>
                                                <LeaveRequest />
                                        </ProtectedRoute>
                                } />
                                <Route path="/request/shift-swap" element={
                                        <ProtectedRoute allowedRoles={NURSE}>
                                                <ShiftSwap />
                                        </ProtectedRoute>
                                } />
                                <Route path="/request/document-update" element={
                                        <ProtectedRoute allowedRoles={NURSE}>
                                                <DocumentUpdate />
                                        </ProtectedRoute>
                                } />
                                <Route path="/request/unit-transfer" element={
                                        <ProtectedRoute allowedRoles={NURSE}>
                                                <UnitTransfer />
                                        </ProtectedRoute>
                                } />
                                <Route path="/request/training" element={
                                        <ProtectedRoute allowedRoles={NURSE}>
                                                <TrainingRequest />
                                        </ProtectedRoute>
                                } />
                                <Route path="/request/general" element={
                                        <ProtectedRoute allowedRoles={NURSE}>
                                                <GeneralRequest />
                                        </ProtectedRoute>
                                } />
                                <Route path="/request/history" element={
                                        <ProtectedRoute allowedRoles={NURSE}>
                                                <RequestHistory />
                                        </ProtectedRoute>
                                } />

                                {/* ── Training ──────────────────────────────────────── */}
                                <Route path="/training" element={
                                        <ProtectedRoute allowedRoles={ALL}>
                                                <TrainingPage />
                                        </ProtectedRoute>
                                } />

                                {/* ── Notifications (all roles) ─────────────────────── */}
                                <Route path="/notifications" element={
                                        <ProtectedRoute allowedRoles={ALL}>
                                                <NotificationsPage />
                                        </ProtectedRoute>
                                } />
                        </Routes>
                </Router>
        );
}

export default App;