import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getEmployeeAttendance } from '../supabaseHelpers';
import '../index.css';

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
  const company_id = employeeData.company_id;
  const employee_id = employeeData.employee_id;

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!company_id || !employee_id) {
        setAttendanceData([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(toDate.getDate() - 6);

      const to_date = toDate.toISOString().split('T')[0];
      const from_date = fromDate.toISOString().split('T')[0];

      try {
        const records = await getEmployeeAttendance(company_id, employee_id, from_date, to_date);
        const formatted = records
          .sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date))
          .map((item) => {
            const inTime = item.in_time ? new Date(item.in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-';
            const outTime = item.out_time ? new Date(item.out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-';

            let total = '-';
            if (item.total_worked_hours !== null && item.total_worked_hours !== undefined) {
              total = `${Number(item.total_worked_hours).toFixed(2)} Hrs`;
            } else if (item.in_time && item.out_time) {
              const diff = new Date(item.out_time) - new Date(item.in_time);
              const hours = diff / 3600000;
              total = `${hours.toFixed(2)} Hrs`;
            }

            const date = new Date(item.attendance_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
            const status = item.attendance_status || (item.in_time ? 'Present' : 'Absent');

            return {
              date,
              status,
              inTime,
              outTime,
              total,
            };
          });

        setAttendanceData(formatted);
      } catch (error) {
        console.error('Error fetching employee attendance:', error);
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [company_id, employee_id]);

  return (
    <div className="attendance-history-page">
      <div className="attendance-history-header shift-for-menu">
        <div className="attendance-history-header-left">
          <ChevronLeft
            size={24}
            className="attendance-history-back"
            onClick={() => navigate('/employee/dashboard')}
          />
          <div>
            <div className="attendance-history-subtitle">Employee Record</div>
            <h1 className="attendance-history-title">Attendance History</h1>
          </div>
        </div>
        <div className="attendance-history-meta">
          <Calendar size={18} />
          <span>Last 7 days</span>
        </div>
      </div>

      <div className="attendance-history-shell">
        <div className="attendance-history-panel">
          <div className="attendance-history-panel-header">
            <div className="attendance-history-panel-title">
              <Clock size={18} />
              <span>Daily Attendance</span>
            </div>
            <span className="attendance-history-updated">Updated today</span>
          </div>

          <div className="card attendance-history-card">
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading attendance...</div>
            ) : attendanceData.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No attendance records available for the last 7 days.
              </div>
            ) : (
              attendanceData.map((item, index) => (
                <div
                  key={`${item.date}-${index}`}
                  className="attendance-history-row"
                  data-last={index === attendanceData.length - 1 ? 'true' : 'false'}
                >
                  <div className="attendance-history-date">
                    <div className="attendance-history-date-label">{item.date}</div>
                    <div className="attendance-history-date-total">Total {item.total}</div>
                  </div>

                  <div className="attendance-history-info">
                    <div>
                      <div className="attendance-history-label">In</div>
                      <div className="attendance-history-value">{item.inTime}</div>
                    </div>
                    <div>
                      <div className="attendance-history-label">Out</div>
                      <div className="attendance-history-value">{item.outTime}</div>
                    </div>
                    <div className="attendance-history-status">
                      <div className={item.status === 'Present' ? 'attendance-history-status-text present' : 'attendance-history-status-text absent'}>
                        {item.status}
                      </div>
                      <div className="attendance-history-status-icon">
                        {item.status === 'Present' ? (
                          <CheckCircle2 size={18} color="var(--green)" />
                        ) : (
                          <XCircle size={18} color="var(--danger)" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
