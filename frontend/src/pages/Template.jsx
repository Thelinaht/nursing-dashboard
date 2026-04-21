import React from "react";
import Layout from "../components/Layout";
import { Users, Activity, FileText, Plus } from "lucide-react";

/**
 * PAGE TEMPLATE
 * Use this as a starting point for creating new dashboard pages.
 * 
 * Instructions:
 * 1. Copy this file.
 * 2. Rename it to your new page name (e.g., MyNewPage.jsx).
 * 3. Update the 'role' and 'username' in the <Layout> component.
 * 4. Use the utility classes provided here to build your UI.
 */

export default function TemplatePage() {
    // 1. Define your columns for the table (make sure they match header/row)
    const tableColumns = "1.5fr 1fr 1fr 0.8fr"; 

    return (
        <Layout 
            role="director" 
            username="User Name"
        >
            <div className="main">
                
                {/* SECTION: Top Stat Cards */}
                <div className="cards-row">
                    <div className="wave-card glass-card">
                        <p><i><Users size={16} color="white" /></i> Total Staff</p>
                        <h1>1,072</h1>
                    </div>
                    
                    <div className="wave-card glass-card">
                        <p><i><FileText size={16} color="white" /></i> Active Tasks</p>
                        <h1>24</h1>
                    </div>
                    
                    <div className="wave-card glass-card danger-text">
                        <p><i><Activity size={16} color="white" /></i> Alerts</p>
                        <h1>3</h1>
                    </div>
                </div>

                {/* SECTION: Main Content / Table */}
                <div className="middle-section" style={{ marginTop: '20px' }}>
                    <div className="table-box content-box" style={{ flex: 1 }}>
                        
                        {/* Box Header */}
                        <div className="box-header">
                            <h2 className="content-box-title">Recent Activity History</h2>
                            <div className="actions">
                                <button 
                                    className="btn-pill" 
                                    style={{ background: 'var(--accent-blue)', color: 'white' }}
                                >
                                    <Plus size={14} /> Add Record
                                </button>
                            </div>
                        </div>

                        {/* Table Layout */}
                        <div className="custom-table" style={{ marginTop: '10px' }}>
                            
                            {/* Header Row */}
                            <div className="table-header" style={{ gridTemplateColumns: tableColumns }}>
                                <span>Subject</span>
                                <span>Category</span>
                                <span>Date</span>
                                <span>Action</span>
                            </div>

                            {/* Data Rows */}
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                
                                { /* Example Row 1 */ }
                                <div className="table-row premium-row" style={{ gridTemplateColumns: tableColumns }}>
                                    <span style={{ fontWeight: 500 }}>Incident Report #102</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>Safety</span>
                                    <span style={{ fontSize: '12px' }}>Oct 24, 2023</span>
                                    <div>
                                        <button className="btn-pill" style={{ background: '#dce4ed', fontSize: '10px' }}>View</button>
                                    </div>
                                </div>

                                { /* Example Row 2 */ }
                                <div className="table-row premium-row" style={{ gridTemplateColumns: tableColumns }}>
                                    <span style={{ fontWeight: 500 }}>Equipment Maintenance</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>Logs</span>
                                    <span style={{ fontSize: '12px' }}>Oct 23, 2023</span>
                                    <div>
                                        <button className="btn-pill" style={{ background: '#dce4ed', fontSize: '10px' }}>View</button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
