import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Calendar, AlertCircle, ArrowLeft } from 'lucide-react';
import supabaseHelpers from '../../supabaseHelpers';

export default function LeaveApplication() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: 'Casual Leave',
    fromDate: '',
    toDate: '',
    reason: '',
    attachments: null,
    isHalfDay: false,
  });

  const defaultLeaveTypes = [
    { value: 'Casual Leave', label: 'Casual Leave', defaultBalance: 8 },
    { value: 'Sick Leave', label: 'Sick Leave', defaultBalance: 10 },
    { value: 'Earned Leave', label: 'Earned Leave', defaultBalance: 20 },
    { value: 'Maternity Leave', label: 'Maternity Leave', defaultBalance: 180 },
    { value: 'Holiday', label: 'Holiday', defaultBalance: 'Unlimited' },
    { value: 'Comp-off', label: 'Comp-off', defaultBalance: 0 },
    { value: 'Unpaid Leave', label: 'Unpaid Leave', defaultBalance: 'Unlimited' },
  ];

  useEffect(() => {
    loadLeaveData();
  }, []);

  const loadLeaveData = async () => {
    try {
      const employeeData = JSON.parse(localStorage.getItem('employeeData'));
      if (!employeeData) {
        navigate('/login');
        return;
      }

      setEmployee(employeeData);
      const { leaves, success } = await supabaseHelpers.getEmployeeLeaves(
        employeeData.company_id,
        employeeData.employee_id
      );

      if (success && leaves) {
        setLeaveRequests(leaves);

        const balance = {};
        defaultLeaveTypes.forEach((type) => {
          // Find if there's an allocation record (allotted_days > 0 and Approved)
          const allocationRow = leaves.find(l => l.leave_type === type.value && l.allotted_days > 0 && l.approval_status === 'Approved');
          
          // Use the allocated amount if it exists, otherwise use hardcoded default
          const totalAllotted = allocationRow ? allocationRow.allotted_days : type.defaultBalance;
          
          // Sum up used days from other requests (where from_date exists)
          const usedDays = leaves
            .filter((l) => l.leave_type === type.value && l.from_date && l.approval_status === 'Approved')
            .reduce((sum, l) => sum + (l.used_days || 0), 0);
            
          balance[type.value] = totalAllotted === 'Unlimited' ? 'Unlimited' : totalAllotted - usedDays;
        });
        setLeaveBalance(balance);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading leave data:', error);
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!formData.fromDate || (!formData.toDate && !formData.isHalfDay)) return 0;
    if (formData.isHalfDay) return 0.5;
    
    const from = new Date(formData.fromDate);
    const to = new Date(formData.toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const days = calculateDays();
    if (days === 0) {
      alert('Please select valid dates');
      return;
    }

    try {
      const leaveData = {
        employee_id: employee.employee_id,
        leave_type: formData.leaveType,
        from_date: formData.fromDate,
        to_date: formData.toDate,
        used_days: days,
        reason: formData.reason,
      };

      console.log('[LeaveApplication] Submitting request:', leaveData);
      const result = await supabaseHelpers.requestLeave(
        employee.company_id,
        leaveData
      );

      if (result.success) {
        alert('Leave request submitted successfully!');
        setFormData({
          leaveType: 'Casual Leave',
          fromDate: '',
          toDate: '',
          reason: '',
          attachments: null,
        });
        setShowForm(false);
        loadLeaveData();
      } else {
        alert(`Error submitting leave request: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Error submitting leave request: ' + error.message);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading leave information...</div>;
  }

  const days = calculateDays();

  return (
    <div className="page-shell">
      <header className="page-header shift-for-menu">
        <button type="button" onClick={() => navigate('/employee/dashboard')} className="icon-button">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="page-label">Leave Center</p>
          <h1 className="page-title">Leave Management</h1>
        </div>
      </header>

      <div className="page-content">
        <div className="content-grid content-grid-3">
          <aside className="panel panel-card panel-aside">
            <div className="panel-heading">
              <div>
                <h2 className="panel-title">Leave Balance</h2>
                <p className="panel-note">Review your remaining leave days.</p>
              </div>
            </div>
            <div className="balance-grid">
              {defaultLeaveTypes.map((type) => (
                <div key={type.value} className="balance-card">
                  <p className="balance-label">{type.label}</p>
                  <p className="balance-value">{leaveBalance[type.value] ?? 0}</p>
                </div>
              ))}
            </div>
          </aside>

          <div className="panel-stack">
            {!showForm && (
              <div className="panel panel-card panel-callout">
                <div className="panel-row">
                  <Calendar size={18} />
                  <div>
                    <p className="panel-title">Request leave</p>
                    <p className="panel-note">Submit a new leave application swiftly.</p>
                  </div>
                </div>
                <button type="button" className="button-primary button-full" onClick={() => setShowForm(true)}>
                  <Calendar size={16} />
                  Apply for Leave
                </button>
              </div>
            )}

            {showForm && (
              <section className="panel panel-card">
                <div className="panel-heading">
                  <div>
                    <h2 className="panel-title">New Leave Request</h2>
                    <p className="panel-note">Choose dates and provide a reason.</p>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="form-stack">
                  <div className="form-field">
                    <label className="form-label">Leave Type</label>
                    <select
                      value={formData.leaveType}
                      onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                      className="input-select"
                    >
                      {defaultLeaveTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-columns">
                    <div className="form-field">
                      <label className="form-label">From Date</label>
                      <input
                        type="date"
                        value={formData.fromDate}
                        onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">To Date</label>
                      <input
                        type="date"
                        value={formData.isHalfDay ? formData.fromDate : formData.toDate}
                        onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                        className="input-field"
                        required={!formData.isHalfDay}
                        disabled={formData.isHalfDay}
                      />
                    </div>
                  </div>

                  <div className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="halfDay"
                      checked={formData.isHalfDay}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({ 
                          ...formData, 
                          isHalfDay: checked,
                          toDate: checked ? formData.fromDate : formData.toDate
                        });
                      }}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="halfDay" className="form-label" style={{ marginBottom: 0 }}>Apply as Half Day</label>
                  </div>

                  {days > 0 && (
                    <div className="alert-box">
                      <AlertCircle size={18} />
                      <span>Total days: <strong>{days}</strong></span>
                    </div>
                  )}

                  <div className="form-field">
                    <label className="form-label">Reason for Leave</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Provide details about your leave request..."
                      className="input-field input-textarea"
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="button-primary button-wide">
                      <Send size={16} />
                      Submit Request
                    </button>
                    <button type="button" className="button-secondary button-wide" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>

          <section className="panel panel-card panel-main">
            <div className="panel-heading">
              <div>
                <h2 className="panel-title">Leave Requests</h2>
                <p className="panel-note">Your latest leave applications and status.</p>
              </div>
            </div>
            <div className="request-list">
              {leaveRequests.length > 0 ? (
                leaveRequests.map((request) => (
                  <article key={request.leave_id} className="request-card">
                    <div>
                      <p className="request-title">{request.leave_type}</p>
                      <p className="request-text">{new Date(request.from_date).toLocaleDateString()} – {new Date(request.to_date).toLocaleDateString()}</p>
                      <p className="request-text">Days: <strong>{request.used_days || request.allotted_days}</strong></p>
                    </div>
                    <span className={`status-pill ${request.approval_status.toLowerCase()}`}>{request.approval_status}</span>
                  </article>
                ))
              ) : (
                <div className="empty-state">No leave requests yet. Submit your first request above.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
