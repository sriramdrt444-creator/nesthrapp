import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, Search, ChevronRight, X, MapPin, Clock, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { getAttendanceForAdminReview, getActiveAllocationsForDate } from '../../supabaseHelpers';
import '../../index.css';

const DailyCheckInList = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [checkInData, setCheckInData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get company_id from localStorage
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const company_id = adminData.company_id;

  useEffect(() => {
    const fetchCheckInData = async () => {
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

        setCheckInData(mergedData);
      } catch (error) {
        console.error('Error fetching check-in data:', error);
        setCheckInData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckInData();
  }, [company_id, selectedDate]);

  const filteredData = checkInData.filter(emp => {
    const matchesFilter = statusFilter === 'All' || 
      emp.status === statusFilter || 
      (statusFilter === 'Invalid' && emp.gpsMatchStatus === 'Invalid Location');
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      emp.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusStyle = (status, gpsMatchStatus) => {
    if (status === 'Present') return { color: 'var(--green)', bgColor: 'rgba(34, 197, 94, 0.1)' };
    if (status === 'Invalid Location' || gpsMatchStatus === 'Invalid Location') return { color: 'var(--warning)', bgColor: 'rgba(245, 158, 11, 0.1)' };
    if (status === 'Absent') return { color: 'var(--danger)', bgColor: 'rgba(239, 68, 68, 0.1)' };
    return { color: 'var(--text-secondary)', bgColor: 'rgba(0, 0, 0, 0.05)' };
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

  const getStatusIcon = (status, gpsMatchStatus) => {
    if (status === 'Present') return <CheckCircle2 size={16} color="var(--green)" />;
    if (status === 'Invalid Location' || gpsMatchStatus === 'Invalid Location') return <AlertCircle size={16} color="var(--warning)" />;
    if (status === 'Absent') return <AlertCircle size={16} color="var(--danger)" />;
    return null;
  };

  const stats = {
    total: checkInData.length,
    present: checkInData.filter(e => e.status === 'Present').length,
    absent: checkInData.filter(e => e.status === 'Absent').length,
    invalid: checkInData.filter(e => e.gpsMatchStatus === 'Invalid Location' || e.status === 'Invalid Location').length
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
          <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Daily Check-In List</h1>
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
        
        {/* Stats Summary */}
        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--card-white)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.total}</div>
          </div>
          <div style={{ backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--green)' }}>
            <div style={{ fontSize: '12px', color: 'var(--green)', marginBottom: '4px' }}>Present</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--green)' }}>{stats.present}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--warning)' }}>
            <div style={{ fontSize: '12px', color: 'var(--warning)', marginBottom: '4px' }}>Invalid</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.invalid}</div>
          </div>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--danger)' }}>
            <div style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '4px' }}>Absent</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--danger)' }}>{stats.absent}</div>
          </div>
        </div>

        {/* Search & Date Filter */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: '12px' }}>
          <div style={{ 
            backgroundColor: 'var(--card-white)', 
            borderRadius: '12px', 
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '13px',
            fontWeight: '500',
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
        <div style={{ display: 'flex', gap: '8px', padding: '8px 20px', overflowX: 'auto', marginBottom: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {['All', 'Present', 'Invalid', 'Absent'].map(filter => (
            <div 
              key={filter}
              onClick={() => setStatusFilter(filter)}
              style={{ ...getFilterStyle(filter), padding: '6px 16px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {filter}
            </div>
          ))}
        </div>

        {/* Employee List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' }}>
          <div className="card" style={{ padding: '0' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading check-in data...</div>
            ) : filteredData.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No check-in records found</div>
            ) : filteredData.map((emp, index) => {
              const statusStyle = getStatusStyle(emp.status, emp.gpsMatchStatus);
              return (
                <div key={index} style={{ 
                  padding: '16px', 
                  borderBottom: index !== filteredData.length - 1 ? '1px solid #E2E8F0' : 'none',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}>
                  {/* Avatar */}
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid ' + statusStyle.color }}>
                    <img src={emp.img} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  
                  {/* Employee Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.id}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getStatusIcon(emp.status, emp.gpsMatchStatus)}
                        <div style={{ fontSize: '11px', fontWeight: '600', color: statusStyle.color }}>
                          {emp.gpsMatchStatus === 'Invalid Location' ? 'Invalid' : emp.status}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>{emp.customer}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.project}</div>
                      </div>
                    </div>

                    {/* Check-in/out Times */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} color="var(--green)" />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>In:</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.inTime}</span>
                      </div>
                      {emp.outTime !== '-' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} color="var(--warning)" />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Out:</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.outTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Button */}
                  <button
                    onClick={() => setSelectedEmployee(emp)}
                    style={{ 
                      backgroundColor: 'transparent',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      color: '#3B82F6',
                      flexShrink: 0
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Eye size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* View Employee Modal */}
      {selectedEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', backgroundColor: 'var(--light-bg)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Check-In Details</h2>
              <X size={24} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSelectedEmployee(null)} />
            </div>

            {/* Profile Section */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', backgroundColor: 'var(--card-white)', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <img src={selectedEmployee.img} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px' }}>{selectedEmployee.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{selectedEmployee.id}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getStatusIcon(selectedEmployee.status, selectedEmployee.gpsMatchStatus)}
                  <div style={{ fontSize: '12px', fontWeight: '600', color: getStatusStyle(selectedEmployee.status, selectedEmployee.gpsMatchStatus).color }}>
                    {selectedEmployee.gpsMatchStatus === 'Invalid Location' ? 'Invalid Location' : selectedEmployee.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Check-In Selfie */}
            {selectedEmployee.selfie && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Check-In Selfie</div>
                <img src={selectedEmployee.selfie} alt="Check-In Selfie" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />
              </div>
            )}

            {/* Check-Out Selfie */}
            {selectedEmployee.checkoutSelfie && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Check-Out Selfie</div>
                <img src={selectedEmployee.checkoutSelfie} alt="Check-Out Selfie" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />
              </div>
            )}

            {/* Time Details */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>Date</span>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{selectedEmployee.date || new Date().toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>Check-In Time</span>
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--green)' }}>{selectedEmployee.inTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>Check-Out Time</span>
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--warning)' }}>{selectedEmployee.outTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>Distance from Site</span>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{selectedEmployee.distance}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>GPS Location</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#3B82F6' }}>
                  <MapPin size={14} /> {selectedEmployee.latitude}, {selectedEmployee.longitude}
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>Customer</span>
                <span style={{ fontWeight: '600', fontSize: '13px' }}>{selectedEmployee.customer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>Project</span>
                <span style={{ fontWeight: '600', fontSize: '13px' }}>{selectedEmployee.project}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyCheckInList;
