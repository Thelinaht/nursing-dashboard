import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ChevronLeft } from "lucide-react";
import Layout from "../components/Layout";
import "../styles/SupervisorDashboard.css";
import "../styles/DirectorDashboard.css";

export default function InpatientStaffingPage() {
  const navigate = useNavigate();
  const [inpatientStaffing, setInpatientStaffing] = useState([]);
  const [staffingFilter, setStaffingFilter] = useState('All');
  const [staffingPage, setStaffingPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const roleMap = {
    1: "nurse", 2: "secretary", 3: "supervisor", 4: "director",
    5: "qualityManager", 6: "trainingDirector", 7: "researchDirector", 8: "assistantDirector"
  };
  const titleMap = {
    1: "Nurse", 2: "Secretary", 3: "Supervisor", 4: "Director",
    5: "Quality Manager", 6: "Training Director", 7: "Researcher", 8: "Patient Services"
  };
  const layoutRole = user && user.role_id ? roleMap[user.role_id] : "director";
  const fallbackName = user && user.role_id ? titleMap[user.role_id] : "Director";
  const displayUsername = user?.full_name || fallbackName;

  const fetchInpatientStaffing = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/dashboard/inpatient-staffing");
      const data = await res.json();
      setInpatientStaffing(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching inpatient staffing:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInpatientStaffing();
  }, []);

  const filteredStaffing = inpatientStaffing.filter(row => {
    if (staffingFilter === 'All') return true;
    if (staffingFilter === 'ICU') return row.unit_name.includes('ICU') || row.unit_name === 'CCU' || row.unit_name === 'HDU';
    if (staffingFilter === 'Pediatric') return row.unit_name.includes('Pediatric') || row.unit_name.includes('PICU') || row.unit_name.includes('NICU');
    if (staffingFilter === 'Medical') return row.unit_name.includes('Medical') && !row.unit_name.includes('ICU');
    if (staffingFilter === 'Surgical') return row.unit_name.includes('Surgical');
    if (staffingFilter === 'OB/GYN') return row.unit_name.includes('Labor') || row.unit_name.includes('Postpartum');
    if (staffingFilter === 'Psychiatry') return row.unit_name.includes('Psychiatry');
    return true;
  });

  const staffingRowsPerPage = 10;
  const totalStaffingPages = Math.ceil(filteredStaffing.length / staffingRowsPerPage);
  const currentStaffingPageRows = filteredStaffing.slice((staffingPage - 1) * staffingRowsPerPage, staffingPage * staffingRowsPerPage);

  const exportStaffingToExcel = () => {
    const csvRows = [];
    csvRows.push(['Unit Name', 'Bed Census', 'Required Ratio', 'Available Nurses', 'Total Needed', 'Gap', 'Status'].join(','));
    filteredStaffing.forEach(row => {
      csvRows.push([
        `"${row.unit_name}"`,
        row.bed_census,
        `"${row.required_ratio}"`,
        row.available_nurses,
        row.total_needed,
        row.gap,
        `"${row.status}"`
      ].join(','));
    });
    
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Inpatient_Staffing.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Layout logoSrc="/logo.png" role={layoutRole} username={displayUsername}>
      <div className="director-dashboard-container" style={{ padding: '20px 30px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--accent-blue)', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            cursor: 'pointer', 
            padding: 0,
            marginBottom: '20px',
            fontSize: '16px'
          }}
        >
          <ChevronLeft size={20} /> Back to Dashboard
        </button>

        <div className="table-box content-box" style={{ width: '100%' }}>
          <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <h2 className="content-box-title" style={{ margin: 0 }}>Inpatient Staffing</h2>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="filter-buttons" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {['All', 'ICU', 'Pediatric', 'Medical', 'Surgical', 'OB/GYN', 'Psychiatry'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => { setStaffingFilter(filter); setStaffingPage(1); }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: staffingFilter === filter ? 'var(--accent-blue)' : '#f1f5f9',
                      color: staffingFilter === filter ? 'white' : '#64748b',
                      fontWeight: staffingFilter === filter ? 600 : 500
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              
              <button
                className="btn-pill"
                style={{ background: '#1E3A5F', color: 'white', gap: '5px', display: 'flex', alignItems: 'center' }}
                onClick={exportStaffingToExcel}
              >
                <Download size={14} />
                Export to Excel
              </button>
            </div>
          </div>

          <div className="custom-table" style={{ marginTop: '20px' }}>
            <div className="table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', fontSize: '14px' }}>
              <span>Unit name</span>
              <span>Bed census</span>
              <span>Required ratio</span>
              <span>Available nurses</span>
              <span>Total needed</span>
              <span>Gap</span>
              <span style={{ textAlign: 'center' }}>Status</span>
            </div>
            <div style={{ minHeight: '200px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#8ea2b5' }}>
                  Loading In-Patient staffing data...
                </div>
              ) : currentStaffingPageRows.length > 0 ? currentStaffingPageRows.map((row, idx) => (
                <div className="table-row premium-row" key={idx} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 15px', marginBottom: '8px', alignItems: 'center', fontSize: '14px' }}>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{row.unit_name}</span>
                  <span>{row.bed_census}</span>
                  <span style={{ color: '#64748b' }}>{row.required_ratio}</span>
                  <span style={{ fontWeight: 500 }}>{row.available_nurses}</span>
                  <span>{row.total_needed}</span>
                  <span style={{ fontWeight: 900, letterSpacing: '0.5px', color: Number(row.gap) < 0 ? '#ef4444' : '#10b981' }}>
                    {Number(row.gap) > 0 ? `+${row.gap}` : row.gap}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span className="badge" style={{ 
                      backgroundColor: row.status === 'OK' ? '#dcfce7' : row.status === 'Partial' ? '#fef3c7' : '#fee2e2', 
                      color: row.status === 'OK' ? '#16a34a' : row.status === 'Partial' ? '#d97706' : '#dc2626', 
                      margin: 0, padding: '4px 10px', fontSize: '14px', width: 'max-content' 
                    }}>
                      {row.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#8ea2b5' }}>
                  No units match this filter.
                </div>
              )}
            </div>
            
            {totalStaffingPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                <button 
                  disabled={staffingPage === 1}
                  onClick={() => setStaffingPage(p => Math.max(1, p - 1))}
                  style={{ border: 'none', background: 'none', cursor: staffingPage === 1 ? 'not-allowed' : 'pointer', color: staffingPage === 1 ? '#cbd5e1' : 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Page {staffingPage} of {totalStaffingPages}</span>
                <button 
                  disabled={staffingPage === totalStaffingPages}
                  onClick={() => setStaffingPage(p => Math.min(totalStaffingPages, p + 1))}
                  style={{ border: 'none', background: 'none', cursor: staffingPage === totalStaffingPages ? 'not-allowed' : 'pointer', color: staffingPage === totalStaffingPages ? '#cbd5e1' : 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
