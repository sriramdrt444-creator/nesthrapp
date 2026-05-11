import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, MessageSquare } from 'lucide-react';
import { allocateLeave, getCompanyEmployees, getEmployeeLeaves } from '../../supabaseHelpers';
import { supabase } from '../../supabaseClient';
import '../../index.css';

const LeaveAllocation = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [leaveAllocations, setLeaveAllocations] = useState({
    'Sick Leave': 0,
    'Casual Leave': 0,
    'Earned Leave': 0,
    'Maternity Leave': 0,
    'Unpaid Leave': 0,
  });
  const [currentBalances, setCurrentBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [editingLeave, setEditingLeave] = useState(null);
  const [editValue, setEditValue] = useState(0);
  const [allAllocations, setAllAllocations] = useState([]);

  const LEAVE_TYPES = [
    { type: 'Sick Leave', description: 'For illness or medical emergencies', icon: '🏥' },
    { type: 'Casual Leave', description: 'For personal reasons', icon: '📅' },
    { type: 'Earned Leave', description: 'Annual paid leave', icon: '⏳' },
    { type: 'Maternity Leave', description: 'For maternity purposes', icon: '👶' },
    { type: 'Unpaid Leave', description: 'Without pay', icon: '📋' },
  ];

  useEffect(() => {
    const loadEmployees = async () => {
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      if (!adminData || !adminData.company_id) {
        navigate('/login');
        return;
      }

      try {
        const result = await getCompanyEmployees(adminData.company_id);
        if (result.success) {
          setEmployees(result.employees || []);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };

    loadEmployees();
  }, [navigate]);


  useEffect(() => {
    const fetchCurrentBalances = async () => {
      if (!selectedEmployee) {
        setCurrentBalances({});
        return;
      }

      const adminData = JSON.parse(localStorage.getItem('adminData'));
      try {
        const result = await getEmployeeLeaves(adminData.company_id, selectedEmployee);
        if (result.success) {
          setAllAllocations(result.leaves.filter(l => l.allotted_days > 0));
          // Calculate balance for each type
          const balances = {};
          result.leaves.forEach(leaf => {
            const type = leaf.leave_type;
            if (!balances[type]) balances[type] = 0;
            if (leaf.approval_status === 'Approved') {
              balances[type] += (leaf.allotted_days || 0) - (leaf.used_days || 0);
            }
          });
          setCurrentBalances(balances);
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    fetchCurrentBalances();
  }, [selectedEmployee]);

  const handleUpdateStock = async (leaveId) => {
    setLoading(true);
    try {
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      const { data, error } = await supabase
        .from('leave_master')
        .update({ 
          allotted_days: editValue,
          balance_days: editValue // Simplified: setting balance to same as allotted for edit
        })
        .eq('leave_id', leaveId)
        .select()
        .single();

      if (error) throw error;
      
      setSuccessMessage('Leave stock updated successfully!');
      setEditingLeave(null);
      // Refresh
      const result = await getEmployeeLeaves(adminData.company_id, selectedEmployee);
      if (result.success) {
        setAllAllocations(result.leaves.filter(l => l.allotted_days > 0));
      }
    } catch (err) {
      setError('Error updating stock: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStock = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete this leave allocation?')) return;
    
    setLoading(true);
    try {
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      const { error } = await supabase
        .from('leave_master')
        .delete()
        .eq('leave_id', leaveId);

      if (error) throw error;
      
      setSuccessMessage('Leave stock deleted successfully!');
      // Refresh
      const result = await getEmployeeLeaves(adminData.company_id, selectedEmployee);
      if (result.success) {
        setAllAllocations(result.leaves.filter(l => l.allotted_days > 0));
      }
    } catch (err) {
      setError('Error deleting stock: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveChange = (leaveType, value) => {
    setLeaveAllocations(prev => ({
      ...prev,
      [leaveType]: parseInt(value) || 0
    }));
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!selectedEmployee) {
      setError('Please select an employee.');
      return;
    }

    const totalDays = Object.values(leaveAllocations).reduce((a, b) => a + b, 0);
    if (totalDays === 0) {
      setError('Please allocate at least one leave day.');
      return;
    }

    setLoading(true);
    try {
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      if (!adminData || !adminData.company_id) {
        setError('Admin session not found. Please login again.');
        navigate('/login');
        return;
      }

      // Allocate each leave type
      for (const [leaveType, days] of Object.entries(leaveAllocations)) {
        if (days > 0) {
          const leaveData = {
            employee_id: selectedEmployee,
            leave_type: leaveType,
            allotted_days: days,
            balance_days: days,
          };
          
          console.log(`[LeaveAllocation] Requesting allocation for ${leaveType}:`, leaveData);
          const result = await allocateLeave(adminData.company_id, leaveData);
          console.log(`[LeaveAllocation] Response for ${leaveType}:`, result);
          
          if (!result.success) {
            throw new Error(`Failed to allocate ${leaveType}: ${result.error}`);
          }
        }
      }

      setSuccessMessage(`Leave allocation successful! Total days: ${totalDays}`);
      setShowMessageDialog(true);
      
      const selectedEmpName = employees.find(e => e.employee_id === selectedEmployee)?.name || selectedEmployee;
      
      setDialogMessage(`✅ Leave successfully allocated to Employee: ${selectedEmpName}\n\nAllocated Leave Summary:\n${
        Object.entries(leaveAllocations)
          .filter(([, days]) => days > 0)
          .map(([type, days]) => `• ${type}: ${days} days`)
          .join('\n')
      }`);

      // Reset form
      setTimeout(() => {
        setSelectedEmployee('');
        setLeaveAllocations({
          'Sick Leave': 0,
          'Casual Leave': 0,
          'Earned Leave': 0,
          'Maternity Leave': 0,
          'Unpaid Leave': 0,
        });
      }, 1000);
    } catch (error) {
      setError('Error allocating leave: ' + error.message);
    } finally {
      setLoading(false);
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
        <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Leave Allocation</h1>
      </div>

      {/* Main Content Area */}
      <div className="app-content" style={{ overflowY: 'auto' }}>
        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: '#991B1B', fontSize: '14px' }}>{error}</span>
          </div>
        )}

        {successMessage && (
          <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <span style={{ color: '#065F46', fontSize: '14px' }}>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleAllocate} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* EMPLOYEE SELECTION SECTION */}
          <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Select Employee</h3>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Employee *</label>
              <select 
                className="input-field" 
                style={{ paddingLeft: '16px' }}
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                required
              >
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* LEAVE TYPES SECTION */}
          <div style={{ paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <MessageSquare size={16} />
              Leave Options (5 Types Available)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              {LEAVE_TYPES.map(({ type, description, icon }) => (
                <div key={type} style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{icon}</span>
                    <div style={{ fontSize: '12px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{type}</div>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', minHeight: '30px' }}>{description}</p>
                  
                  {selectedEmployee && (
                    <div style={{ marginBottom: '12px', padding: '6px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>Current Stock:</span>
                      <span style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: '800' }}>{currentBalances[type] || 0} days</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="number" 
                      min="0"
                      max="365"
                      className="input-field" 
                      placeholder="Days" 
                      value={leaveAllocations[type]}
                      onChange={(e) => handleLeaveChange(type, e.target.value)}
                      style={{ flex: 1, padding: '8px', fontSize: '13px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '40px' }}>days</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Section */}
            <div style={{ backgroundColor: '#F3F4F6', padding: '16px', borderRadius: '12px', marginTop: '20px', border: '1px solid #E5E7EB' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'var(--font-semibold)', marginBottom: '12px', color: 'var(--text-primary)' }}>Allocation Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {Object.entries(leaveAllocations).map(([type, days]) => (
                  days > 0 && (
                    <div key={type} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{type}:</span>
                      <span style={{ fontWeight: '600', color: 'var(--dark-navy)' }}>{days} days</span>
                    </div>
                  )
                ))}
              </div>
              <div style={{ borderTop: '1px solid #D1D5DB', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'var(--font-semibold)', color: 'var(--dark-navy)' }}>
                <span>Total Leave Days:</span>
                <span>{Object.values(leaveAllocations).reduce((a, b) => a + b, 0)} days</span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={loading}>
            {loading ? 'Allocating...' : 'Allocate Leave to Employee'}
          </button>
        </form>

        {/* MANAGE EXISTING STOCK SECTION */}
        {selectedEmployee && allAllocations.length > 0 && (
          <div className="card" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>Manage Existing Stock</h3>
            <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>Edit or remove current leave allocations for this employee.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allAllocations.map((alloc) => (
                <div key={alloc.leave_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '20px' }}>
                      {LEAVE_TYPES.find(t => t.type === alloc.leave_type)?.icon || '📋'}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{alloc.leave_type}</p>
                      <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Allotted: <strong>{alloc.allotted_days} days</strong></p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {editingLeave === alloc.leave_id ? (
                      <>
                        <input 
                          type="number" 
                          value={editValue} 
                          onChange={(e) => setEditValue(parseFloat(e.target.value))}
                          style={{ width: '60px', padding: '6px', borderRadius: '8px', border: '1px solid #3B82F6', fontSize: '13px' }}
                        />
                        <button 
                          onClick={() => handleUpdateStock(alloc.leave_id)}
                          style={{ padding: '6px 12px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingLeave(null)}
                          style={{ padding: '6px 12px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setEditingLeave(alloc.leave_id);
                            setEditValue(alloc.allotted_days);
                          }}
                          style={{ padding: '6px 12px', backgroundColor: 'white', color: '#3B82F6', border: '1px solid #3B82F6', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteStock(alloc.leave_id)}
                          style={{ padding: '6px 12px', backgroundColor: 'white', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message Dialog */}
      {showMessageDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'var(--font-semibold)', marginBottom: '12px', color: 'var(--text-primary)' }}>Leave Allocation Success</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
              {dialogMessage}
            </p>
            <button 
              onClick={() => setShowMessageDialog(false)}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveAllocation;
