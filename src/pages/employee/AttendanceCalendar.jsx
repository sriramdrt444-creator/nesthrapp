import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { getEmployeeAttendance } from '../../supabaseHelpers';

const AttendanceCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  const employee = JSON.parse(localStorage.getItem('employeeData') || '{}');

  useEffect(() => {
    fetchAttendance();
  }, [currentDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const res = await getEmployeeAttendance(
        employee.company_id, 
        employee.employee_id, 
        firstDay.toISOString().split('T')[0], 
        lastDay.toISOString().split('T')[0]
      );
      setAttendanceData(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const getAttendanceForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceData.find(a => a.attendance_date === dateStr);
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '100px' }}>
      {/* Header */}
      <div className="shift-for-menu" style={{ padding: '24px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ChevronLeft size={24} style={{ cursor: 'pointer' }} onClick={() => navigate('/employee/dashboard')} />
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Attendance Calendar</h1>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Calendar Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <button onClick={prevMonth} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'transparent' }}><ChevronLeft size={20} /></button>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{monthName} {year}</div>
          <button onClick={nextMonth} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'transparent' }}><ChevronRight size={20} /></button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '12px', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10B981' }} />
            <span>Present</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#EF4444' }} />
            <span>Absent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#F59E0B' }} />
            <span>Half Day</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '12px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const attendance = getAttendanceForDay(day);
              let bgColor = 'transparent';
              let textColor = '#0F172A';
              
              if (attendance) {
                if (attendance.attendance_status === 'Present') bgColor = 'rgba(16, 185, 129, 0.15)', textColor = '#10B981';
                else if (attendance.attendance_status === 'Absent') bgColor = 'rgba(239, 68, 68, 0.15)', textColor = '#EF4444';
                else if (attendance.attendance_status === 'Half Day') bgColor = 'rgba(245, 158, 11, 0.15)', textColor = '#F59E0B';
              }

              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

              return (
                <div 
                  key={day} 
                  style={{ 
                    aspectRatio: '1', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: '12px', 
                    backgroundColor: bgColor,
                    color: textColor,
                    fontSize: '14px',
                    fontWeight: 700,
                    border: isToday ? '2px solid #3B82F6' : 'none',
                    position: 'relative'
                  }}
                >
                  {day}
                  {attendance?.in_time && <div style={{ fontSize: '8px', marginTop: '2px', opacity: 0.8 }}>{new Date(attendance.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary List */}
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>Monthly Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Present
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>{attendanceData.filter(a => a.attendance_status === 'Present').length}</div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                <XCircle size={16} /> Absent
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>{attendanceData.filter(a => a.attendance_status === 'Absent').length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
