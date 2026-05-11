import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Clock, Calendar, User, Search, Filter } from 'lucide-react';
import { getAllCompanyLeaves, updateLeaveStatus } from '../../supabaseHelpers';
import '../../index.css';

const LeaveApproval = () => {
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [allLeaveRecords, setAllLeaveRecords] = useState([]);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (!adminData || !adminData.company_id) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const result = await getAllCompanyLeaves(adminData.company_id);
      if (result.success) {
        setAllLeaveRecords(result.leaves);
        // Filter out records that are actually allocations (allotted_days > 0)
        // We only want leave applications (used_days > 0 or Pending)
        const applications = result.leaves.filter(l => l.from_date && (l.used_days > 0 || l.approval_status === 'Pending' || l.approval_status === 'Approved' || l.approval_status === 'Rejected'));
        setLeaveRequests(applications);
      } else {
        setError('Failed to load leave requests.');
      }
    } catch (err) {
      setError('Error fetching leave requests.');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingBalance = (employeeId, leaveType) => {
    // 1. Get all allocation records for this employee and type
    const allocations = allLeaveRecords.filter(r => 
      r.employee_id === employeeId && 
      r.leave_type === leaveType && 
      r.allotted_days > 0
    );
    const totalAllotted = allocations.reduce((sum, r) => sum + (r.allotted_days || 0), 0);

    // 2. Get all approved leave requests for this employee and type
    const approvedRequests = allLeaveRecords.filter(r => 
      r.employee_id === employeeId && 
      r.leave_type === leaveType && 
      r.approval_status === 'Approved' &&
      r.used_days > 0
    );
    const totalUsed = approvedRequests.reduce((sum, r) => sum + (r.used_days || 0), 0);

    return totalAllotted - totalUsed;
  };

  const handleAction = async (leaveId, status) => {
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (!adminData || !adminData.company_id) return;

    try {
      const result = await updateLeaveStatus(adminData.company_id, leaveId, status);
      if (result.success) {
        // Update local state
        setLeaveRequests(prev => 
          prev.map(req => req.leave_id === leaveId ? { ...req, approval_status: status } : req)
        );
      } else {
        alert('Failed to update status: ' + result.error);
      }
    } catch (err) {
      alert('Error updating leave status.');
    }
  };

  const filteredRequests = leaveRequests.filter(req => {
    const matchesFilter = filter === 'All' || req.approval_status === filter;
    const empName = req.employee_master?.name || '';
    const matchesSearch = empName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          req.leave_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle size={16} color="#10B981" />;
      case 'Rejected': return <XCircle size={16} color="#EF4444" />;
      default: return <Clock size={16} color="#F59E0B" />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-bg)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--card-white)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid #E2E8F0' }}>
        <ChevronLeft 
          size={24} 
          style={{ position: 'absolute', left: '20px', cursor: 'pointer', color: 'var(--text-primary)' }} 
          onClick={() => navigate('/admin')}
        />
        <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Leave Approval</h1>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '16px 20px', backgroundColor: 'white', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input 
            type="text" 
            placeholder="Search employee or leave type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filter === f ? 'var(--dark-navy)' : '#F1F5F9',
                color: filter === f ? 'white' : '#64748B',
                transition: 'all 0.2s'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="app-content" style={{ overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading requests...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#EF4444' }}>{error}</div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ backgroundColor: '#F1F5F9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Clock size={32} color="#94A3B8" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '8px' }}>No requests found</h3>
            <p style={{ fontSize: '14px', color: '#64748B' }}>There are no leave requests matching your criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredRequests.map((req) => (
              <div key={req.leave_id} className="card" style={{ padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dark-navy)', fontWeight: '700', fontSize: '18px' }}>
                      {req.employee_master?.name?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', marginBottom: '2px' }}>{req.employee_master?.name || 'Unknown Employee'}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B' }}>
                        <User size={12} /> {req.employee_id}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', backgroundColor: req.approval_status === 'Approved' ? '#ECFDF5' : (req.approval_status === 'Rejected' ? '#FEF2F2' : '#FFFBEB'), color: req.approval_status === 'Approved' ? '#059669' : (req.approval_status === 'Rejected' ? '#DC2626' : '#D97706'), fontSize: '12px', fontWeight: '700' }}>
                      {getStatusIcon(req.approval_status)}
                      {req.approval_status}
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#0284C7', textTransform: 'uppercase' }}>Stock:</span>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: '#0369A1' }}>{getRemainingBalance(req.employee_id, req.leave_type)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '16px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Leave Type</p>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{req.leave_type}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Duration</p>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{req.used_days} Day(s)</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Date Range</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                      <Calendar size={14} color="#64748B" />
                      {new Date(req.from_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(req.to_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Reason</p>
                  <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5', padding: '12px', backgroundColor: '#F1F5F9', borderRadius: '12px' }}>
                    {req.reason || "No reason provided."}
                  </p>
                </div>

                {req.approval_status === 'Pending' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => handleAction(req.leave_id, 'Approved')}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: '#10B981', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <CheckCircle size={18} /> Approve
                    </button>
                    <button 
                      onClick={() => handleAction(req.leave_id, 'Rejected')}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: 'white', color: '#EF4444', border: '1px solid #EF4444', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveApproval;
