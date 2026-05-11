import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Calendar, MapPin, CheckCircle, FileText, LogOut } from 'lucide-react';
import { getEmployeeCurrentAllocation, getEmployeeAttendance } from '../supabaseHelpers';
import '../index.css';

const Dashboard = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [allocation, setAllocation] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);

  const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
  const company_id = employeeData.company_id;
  const employee_id = employeeData.employee_id;

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!company_id || !employee_id) return;

      const today = new Date().toISOString().split('T')[0];
      const allocationData = await getEmployeeCurrentAllocation(company_id, employee_id, today);
      setAllocation(allocationData);

      const attendanceRecords = await getEmployeeAttendance(company_id, employee_id, today, today);
      setTodayAttendance(attendanceRecords?.[0] || null);
    };

    fetchDashboardData();
  }, [company_id, employee_id]);

  const customerName = allocation?.customer?.customer_name || 'No assignment today';
  const projectName = allocation?.project?.project_name || '';
  const durationText = allocation ? `${allocation.from_date} - ${allocation.to_date || 'Ongoing'}` : '-';
  const checkedIn = todayAttendance?.in_time;
  const checkedOut = todayAttendance?.out_time;
  const workStatus = checkedIn ? (checkedOut ? 'Checked Out' : 'Checked In') : 'Not Checked In';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-bg)' }}>
      {/* Header */}
      <div className="app-header">
        <div style={{ position: 'relative' }}>
          <button className="header-menu-button" type="button" onClick={onMenuToggle}>
            <Menu size={24} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ color: 'var(--green)', fontWeight: 'bold', fontSize: '18px' }}>NEST<span style={{ color: 'white' }}>HR</span></span>
          <span style={{ color: 'var(--green)', fontWeight: 'bold', fontSize: '18px' }}>GeoTrack</span>
          <MapPin size={16} color="var(--green)" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="app-content">
        {/* Greeting Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Good Morning,</div>
            <div style={{ fontSize: '18px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{employeeData.name || 'Employee'} <span role="img" aria-label="wave"></span></div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.name || 'Employee')}&background=random`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Today's Plan Card */}
        <div className="card" style={{ marginBottom: '20px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px dashed #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontWeight: 'var(--font-medium)' }}>
              <Calendar size={18} />
              Today's Plan
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'var(--font-medium)' }}>{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Project</div>
                <div style={{ fontSize: '14px', fontWeight: 'var(--font-medium)' }}>{projectName}</div>
              </div>
              <div style={{ 
                backgroundColor: checkedIn ? (checkedOut ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)') : 'rgba(239, 68, 68, 0.1)', 
                color: checkedIn ? (checkedOut ? 'var(--green)' : '#3B82F6') : 'var(--danger)', 
                padding: '4px 12px', 
                borderRadius: '16px', 
                fontSize: '12px', 
                fontWeight: 'var(--font-medium)' 
              }}>
                {workStatus}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Customer</div>
              <div style={{ fontSize: '14px', fontWeight: 'var(--font-medium)' }}>{customerName}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Duration</div>
              <div style={{ fontSize: '14px', fontWeight: 'var(--font-medium)' }}>{durationText}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div 
            className="card" 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '20px 16px' }}
            onClick={() => navigate('/checkin')}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--green)' }}>
              <CheckCircle size={24} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 'var(--font-semibold)' }}>Check In</span>
          </div>

          <div 
            className="card" 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '20px 16px' }}
            onClick={() => navigate('/timesheet')}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3B82F6' }}>
              <Calendar size={24} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 'var(--font-semibold)' }}>Timesheet</span>
          </div>

          <div 
            className="card" 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '20px 16px' }}
            onClick={() => navigate('/checkout')}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--warning)' }}>
              <LogOut size={24} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 'var(--font-semibold)' }}>Check Out</span>
          </div>
        </div>

        {/* More Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div 
            className="card" 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px 12px' }}
            onClick={() => navigate('/allocation')}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#8B5CF6' }}>
              <MapPin size={20} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 'var(--font-semibold)' }}>My Allocation</span>
          </div>

          <div 
            className="card" 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px 12px' }}
            onClick={() => navigate('/attendance')}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--warning)' }}>
              <FileText size={20} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 'var(--font-semibold)' }}>Attendance History</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
