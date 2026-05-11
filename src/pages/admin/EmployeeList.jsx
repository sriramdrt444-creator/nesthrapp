/**
 * @typedef {Object} Employee
 * @property {string} employee_id
 * @property {string} name
 * @property {string} email
 * @property {string} [phone_number]
 * @property {string} [role]
 * @property {boolean} [is_active]
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Search, User, Mail, ShieldCheck, Trash2, Edit2 } from 'lucide-react';
import { getCompanyEmployees, deleteCompanyEmployee } from '../../supabaseHelpers';
import '../../index.css';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState(/** @type {Employee[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}') || {};
  const company_id = adminData?.company_id;

  const fetchEmployees = async () => {
    if (!company_id) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await getCompanyEmployees(company_id);
    if (result.success) {
      setEmployees(result.employees || []);
    } else {
      setEmployees([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, [company_id]);

  const handleDelete = async (employeeId, employeeName) => {
    if (window.confirm(`Are you sure you want to delete employee "${employeeName}" (${employeeId})? This action cannot be undone.`)) {
      try {
        setLoading(true);
        const result = await deleteCompanyEmployee(company_id, employeeId);
        if (result.success) {
          alert('Employee deleted successfully');
          fetchEmployees();
        } else {
          alert('Error deleting employee: ' + result.error);
        }
      } catch (error) {
        alert('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const query = searchQuery.toLowerCase();
    return (
      employee.name?.toLowerCase().includes(query) ||
      employee.employee_id?.toLowerCase().includes(query) ||
      employee.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-bg)' }}>
      <div style={{ backgroundColor: 'var(--card-white)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ChevronLeft size={24} style={{ cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => navigate('/admin')} />
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Employee Master</h1>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>View and manage all employees</div>
          </div>
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          onClick={() => navigate('/admin/employee/create')}
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, or email"
            style={{
              width: '100%',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px 14px',
              outline: 'none',
              fontSize: '13px',
              color: 'var(--text-primary)',
              backgroundColor: 'white'
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div className="card" style={{ padding: '0' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading employees...</div>
            ) : filteredEmployees.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No employees found.
              </div>
            ) : (
              filteredEmployees.map((employee, index) => (
                <div
                  key={employee.employee_id || index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '16px',
                    alignItems: 'center',
                    padding: '18px 20px',
                    borderBottom: index !== filteredEmployees.length - 1 ? '1px solid #E2E8F0' : 'none'
                  }}
                >
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{employee.name || 'Unknown'}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>ID: {employee.employee_id}</span>
                      {employee.phone_number && <span>• {employee.phone_number}</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{employee.email || 'No email provided'}</div>
                    {employee.designation && (
                      <div style={{ fontSize: '12px', color: 'var(--green)', fontWeight: '600', marginTop: '2px' }}>
                        {employee.designation} {employee.department ? `(${employee.department})` : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', backgroundColor: '#F0F9FF', color: '#0369A1', fontSize: '11px', fontWeight: '700' }}>
                      <ShieldCheck size={12} /> {employee.role || 'Employee'}
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '12px', color: 'var(--zoho-blue)', borderColor: 'var(--zoho-border)' }}
                      onClick={() => navigate(`/admin/employee/edit/${employee.employee_id}`)}
                    >
                      <Edit2 size={14} style={{ marginRight: '4px' }} /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '12px', color: '#DC2626', borderColor: '#FCA5A5' }}
                      onClick={() => handleDelete(employee.employee_id, employee.name)}
                    >
                      <Trash2 size={14} style={{ marginRight: '4px' }} /> Delete
                    </button>
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

export default EmployeeList;
