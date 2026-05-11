import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, ChevronLeft } from 'lucide-react';
import '../index.css';

const AttendanceResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const attendanceResult = location.state?.attendanceResult || JSON.parse(window.localStorage.getItem('latestAttendanceResult') || 'null');

  const title = attendanceResult?.attendance_type === 'checkout' ? 'Check-Out Successful!' : 'Check-In Successful!';
  const subtitle = attendanceResult?.attendance_type === 'checkout'
    ? 'Your checkout has been recorded.'
    : 'You have been marked Present';

  const customerName = attendanceResult?.customer_name || 'Unknown Customer';
  const projectName = attendanceResult?.project_name || 'Unknown Project';
  const inTime = attendanceResult?.in_time ? new Date(attendanceResult.in_time).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Unknown';
  const outTime = attendanceResult?.out_time ? new Date(attendanceResult.out_time).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Unknown';
  const gpsStatus = attendanceResult?.gps_match_status || attendanceResult?.location_status || 'N/A';
  const distanceText = attendanceResult?.out_distance != null ? `${attendanceResult.out_distance} Meters` : (attendanceResult?.in_distance != null ? `${attendanceResult.in_distance} Meters` : 'N/A');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--card-white)' }}>
      <div className="shift-for-menu" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ChevronLeft size={24} style={{ cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => navigate('/employee/dashboard')} />
        <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Attendance Result</h1>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', overflowY: 'auto' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--green)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          color: 'white',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
        }}>
          <Check size={40} strokeWidth={3} />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>{subtitle}</p>

        <div style={{ 
          backgroundColor: '#F0FDF4', 
          borderRadius: '16px', 
          padding: '24px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Customer</div>
            <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)' }}>{customerName}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Project</div>
            <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)' }}>{projectName}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>In Time</div>
            <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)' }}>{inTime}</div>
          </div>

          {attendanceResult?.out_time && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Out Time</div>
              <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)' }}>{outTime}</div>
            </div>
          )}

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Location</div>
            <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', color: 'var(--green)' }}>{gpsStatus} ({distanceText})</div>
          </div>

          {attendanceResult?.out_selfie && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Check-Out Selfie</div>
              <img src={attendanceResult.out_selfie} alt="Checkout Selfie" style={{ width: '100%', borderRadius: '16px', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <button 
          className="btn-primary" 
          style={{ backgroundColor: 'var(--dark-navy)' }}
          onClick={() => navigate('/employee/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AttendanceResult;
