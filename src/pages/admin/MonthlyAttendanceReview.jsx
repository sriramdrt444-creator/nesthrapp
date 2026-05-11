import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Calendar, User, Info } from 'lucide-react';
import { getCompanyMonthlyAttendance, getCompanyEmployees } from '../../supabaseHelpers';
import '../../index.css';

const MonthlyAttendanceReview = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const company_id = adminData.company_id;

  useEffect(() => {
    if (company_id) {
      loadData();
    }
  }, [company_id, currentDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const startStr = firstDay.toISOString().split('T')[0];
      const endStr = lastDay.toISOString().split('T')[0];

      // Load employees and attendance in parallel
      const [empResult, attResult] = await Promise.all([
        getCompanyEmployees(company_id),
        getCompanyMonthlyAttendance(company_id, startStr, endStr)
      ]);

      if (empResult.success) setEmployees(empResult.employees);
      if (attResult.success) setAttendanceRecords(attResult.attendance);

    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getStatus = (employee_id, day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = attendanceRecords.find(r => r.employee_id === employee_id && r.attendance_date === dateStr);
    
    if (!record) return '-';
    if (record.attendance_status === 'Present') return 'P';
    if (record.attendance_status === 'Absent') return 'X';
    if (record.attendance_status === 'Half Day') return 'H';
    return '-';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'P': return '#10B981'; // Green
      case 'X': return '#EF4444'; // Red
      case 'H': return '#F59E0B'; // Orange
      default: return '#94A3B8'; // Slate
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-bg)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--dark-navy)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ChevronLeft size={24} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin')} />
          <h1 style={{ fontSize: '18px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Monthly Attendance Review</h1>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={prevMonth} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white' }}><ChevronLeft size={18} /></button>
          <div style={{ fontSize: '15px', fontWeight: '700', minWidth: '140px', textAlign: 'center' }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={nextMonth} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white' }}><ChevronRight size={18} /></button>
        </div>

        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input 
            type="text" 
            placeholder="Search employee..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px' }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            Loading attendance data...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No employees found</div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredEmployees.map((emp) => (
              <div key={emp.employee_id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B' }}>{emp.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>ID: {emp.employee_id}</div>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                    {currentDate.toLocaleString('default', { month: 'short' })}
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))', 
                  gap: '6px' 
                }}>
                  {daysArray.map(day => {
                    const status = getStatus(emp.employee_id, day);
                    return (
                      <div 
                        key={day} 
                        style={{ 
                          aspectRatio: '1',
                          borderRadius: '6px', 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: '800',
                          backgroundColor: status === '-' ? '#F1F5F9' : `${getStatusColor(status)}15`,
                          color: status === '-' ? '#94A3B8' : getStatusColor(status),
                          border: status === '-' ? 'none' : `1px solid ${getStatusColor(status)}30`,
                          position: 'relative'
                        }}
                        title={`Day ${day}: ${status}`}
                      >
                        {day}
                        {status !== '-' && (
                          <div style={{ 
                            position: 'absolute', 
                            bottom: '2px', 
                            width: '4px', 
                            height: '4px', 
                            borderRadius: '50%', 
                            backgroundColor: getStatusColor(status) 
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '16px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#10B98115', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '10px' }}>P</div>
            <span>Present</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#EF444415', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '10px' }}>X</div>
            <span>Absent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#F59E0B15', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '10px' }}>H</div>
            <span>Half Day</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: 'transparent', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '10px' }}>-</div>
            <span>No Record</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAttendanceReview;
