import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, Search, ChevronRight, X, MapPin, TrendingUp } from 'lucide-react';
import { getAttendanceForAdminReview, getActiveAllocationsForDate, updateAttendanceStatus } from '../supabaseHelpers';
import '../index.css';

const AdminReview = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get company_id from localStorage
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const company_id = adminData.company_id;

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!company_id) return;

      setLoading(true);
      try {
        // Get attendance records for the date
        const attendanceRecords = await getAttendanceForAdminReview(company_id, selectedDate);

        // Get all active allocations for the date
        const allocations = await getActiveAllocationsForDate(company_id, selectedDate);

        // Create a map of attendance by employee_id
        const attendanceMap = {};
        attendanceRecords.forEach(record => {
          attendanceMap[record.id] = record;
        });

        // Merge allocations with attendance data
        const mergedData = allocations.map(allocation => {
          const attendance = attendanceMap[allocation.employee_id];
          if (attendance) {
            return attendance;
          } else {
            // No attendance record - mark as absent
            return {
              id: allocation.employee_id,
              name: allocation.employee_master.name,
              status: 'Absent',
              inTime: '-',
              outTime: '-',
              customer: allocation.customer_master.customer_name,
              project: allocation.project_master.project_name,
              img: `https://ui-avatars.com/api/?name=${encodeURIComponent(allocation.employee_master.name)}`,
              selfie: null,
              distance: '-',
              latitude: '-',
              longitude: '-',
              gpsMatchStatus: null
            };
          }
        });

        setAttendanceData(mergedData);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [company_id, selectedDate]);

  const filteredData = attendanceData.filter(emp => {
    const matchesFilter = statusFilter === 'All' || 
      emp.status === statusFilter || 
      (statusFilter === 'Invalid' && emp.gpsMatchStatus === 'Invalid Location');
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      emp.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusStyle = (status, gpsMatchStatus) => {
    if (status === 'Present') return { color: 'var(--green)' };
    if (status === 'Invalid Location' || gpsMatchStatus === 'Invalid Location') return { color: 'var(--warning)' };
    if (status === 'Absent') return { color: 'var(--danger)' };
    return { color: 'var(--text-secondary)' };
  };

  const getFilterStyle = (filterName) => {
    if (statusFilter === filterName) {
      if (filterName === 'All' || filterName === 'Present') return { backgroundColor: 'var(--green)', color: 'white', border: '1px solid var(--green)' };
      if (filterName === 'Invalid') return { backgroundColor: 'var(--warning)', color: 'white', border: '1px solid var(--warning)' };
      if (filterName === 'Absent') return { backgroundColor: 'var(--danger)', color: 'white', border: '1px solid var(--danger)' };
    }
    // Inactive styles
    if (filterName === 'All' || filterName === 'Present') return { backgroundColor: '#F0FDF4', color: 'var(--green)', border: '1px solid var(--green)' };
    if (filterName === 'Invalid') return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid var(--warning)' };
    if (filterName === 'Absent') return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' };
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--dark-navy)' }}>
      {/* Header */}
      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ChevronLeft 
            size={24} 
            style={{ cursor: 'pointer' }} 
            onClick={() => navigate('/admin')}
          />
          <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Attendance Review</h1>
        </div>
        <Filter size={20} style={{ cursor: 'pointer' }} />
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'var(--light-bg)', 
        borderTopLeftRadius: '24px', 
        borderTopRightRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Search & Date Filter */}
        <div style={{ padding: '20px 20px 10px 20px', display: 'flex', gap: '12px' }}>
          <div style={{ 
            backgroundColor: 'var(--card-white)', 
            borderRadius: '12px', 
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '13px',
            fontWeight: 'var(--font-medium)',
            border: '1px solid #E2E8F0',
            whiteSpace: 'nowrap'
          }}>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontFamily: 'Poppins', color: 'var(--text-primary)' }}
            />
          </div>
          
          <div style={{ 
            backgroundColor: 'var(--card-white)', 
            borderRadius: '12px', 
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            border: '1px solid #E2E8F0'
          }}>
            <Search size={16} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search Employee..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', fontFamily: 'Poppins' }}
            />
          </div>
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 20px', overflowX: 'auto', marginBottom: '16px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {['All', 'Present', 'Invalid', 'Absent'].map(filter => (
            <div 
              key={filter}
              onClick={() => setStatusFilter(filter)}
              style={{ ...getFilterStyle(filter), padding: '6px 16px', borderRadius: '16px', fontSize: '12px', fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {filter}
            </div>
          ))}
        </div>

        {/* Employee List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' }}>
          <div className="card" style={{ padding: '0' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
            ) : filteredData.length === 0 ? (
               <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No records found</div>
            ) : filteredData.map((emp, index) => (
              <div key={index} style={{ 
                padding: '16px', 
                borderBottom: index !== filteredData.length - 1 ? '1px solid #E2E8F0' : 'none',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={emp.img} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{emp.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'var(--font-semibold)', ...getStatusStyle(emp.status, emp.gpsMatchStatus) }}>
                        {emp.gpsMatchStatus === 'Invalid Location' ? 'Invalid Location' : emp.status}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 'var(--font-semibold)' }}>{emp.inTime}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>{emp.customer}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.project}</div>
                    </div>
                    <div 
                      onClick={() => setSelectedEmployee(emp)}
                      style={{ 
                        color: '#3B82F6', 
                        fontSize: '13px', 
                        fontWeight: 'var(--font-medium)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '6px'
                      }}
                    >
                      View <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View Employee Modal */}
      {selectedEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', backgroundColor: 'var(--light-bg)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Attendance Details</h2>
              <X size={24} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSelectedEmployee(null)} />
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img src={selectedEmployee.img} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedEmployee.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedEmployee.id}</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', ...getStatusStyle(selectedEmployee.status, selectedEmployee.gpsMatchStatus), marginTop: '4px' }}>
                  {selectedEmployee.gpsMatchStatus === 'Invalid Location' ? 'Invalid Location' : selectedEmployee.status}
                </div>
              </div>
            </div>

            {selectedEmployee.selfie && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Check-In Selfie</div>
                <img src={selectedEmployee.selfie} alt="Check-In Selfie" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px' }} />
              </div>
            )}

            {selectedEmployee.checkoutSelfie && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', margin: '16px 0 8px' }}>Check-Out Selfie</div>
                <img src={selectedEmployee.checkoutSelfie} alt="Check-Out Selfie" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px' }} />
              </div>
            )}

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Check-In Time</span>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{selectedEmployee.inTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Check-Out Time</span>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{selectedEmployee.outTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Distance from Site</span>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{selectedEmployee.distance}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>GPS Location</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#3B82F6' }}>
                  <MapPin size={14} /> {selectedEmployee.latitude}, {selectedEmployee.longitude}
                </div>
              </div>
            </div>

            <button 
              className="btn-secondary" 
              style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => navigate(`/admin/performance/employee/${selectedEmployee.id}`)}
            >
              <TrendingUp size={18} /> View Performance History
            </button>

            {selectedEmployee.gpsMatchStatus === 'Invalid Location' && (
              <button 
                className="btn-primary" 
                style={{ backgroundColor: 'var(--green)' }}
                onClick={async () => {
                  if (!company_id) return;
                  const result = await updateAttendanceStatus(
                    company_id, 
                    selectedEmployee.id, 
                    selectedDate, 
                    'Present', 
                    'Manually approved by admin'
                  );
                  if (result.success) {
                    alert('Attendance overridden successfully!');
                    // Update local state to reflect change
                    setAttendanceData(prev => 
                      prev.map(emp => emp.id === selectedEmployee.id ? { ...emp, gpsMatchStatus: 'Manually Approved', status: 'Present' } : emp)
                    );
                    setSelectedEmployee(null);
                  } else {
                    alert('Error: ' + result.error);
                  }
                }}
              >
                Approve Timesheet Override
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReview;
