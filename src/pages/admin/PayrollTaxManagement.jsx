import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Download, ListChecks, RefreshCw, X } from 'lucide-react';
import { calculateEmployeeSalary, generatePayslip, getCompanyEmployees, getCompanyTaxDeclarations } from '../../supabaseHelpers';
import '../../index.css';

const PayrollTaxManagement = () => {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [salaryMonth, setSalaryMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [salaryResult, setSalaryResult] = useState(null);
  const [taxDeclarations, setTaxDeclarations] = useState([]);
  const [adminInfo, setAdminInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);

  useEffect(() => {
    const loadAdminData = async () => {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      if (!adminData.company_id) {
        navigate('/login');
        return;
      }

      setCompanyId(adminData.company_id);
      setAdminInfo(adminData);
      setLoading(true);

      const [employeeResult, taxResult] = await Promise.all([
        getCompanyEmployees(adminData.company_id),
        getCompanyTaxDeclarations(adminData.company_id),
      ]);

      if (employeeResult.success) {
        setEmployees(employeeResult.employees || []);
        setSelectedEmployeeId(employeeResult.employees?.[0]?.employee_id || '');
      }

      if (taxResult.success) {
        setTaxDeclarations(taxResult.declarations || []);
      }

      setLoading(false);
    };

    loadAdminData();
  }, [navigate]);

  const selectedEmployee = employees.find((emp) => emp.employee_id === selectedEmployeeId);
  const filteredDeclarations = selectedEmployeeId
    ? taxDeclarations.filter((item) => item.employee_id === selectedEmployeeId)
    : taxDeclarations;

  const handleCalculateSalary = async () => {
    setError('');
    setSalaryResult(null);

    if (!selectedEmployeeId) {
      setError('Please select an employee to calculate salary.');
      return;
    }

    if (!salaryMonth) {
      setError('Please select a salary month.');
      return;
    }

    setCalcLoading(true);
    const result = await calculateEmployeeSalary(companyId, selectedEmployeeId, salaryMonth);

    if (result.success) {
      setSalaryResult(result);
    } else {
      setError(result.error || 'Failed to calculate salary.');
    }

    setCalcLoading(false);
  };

  const handleGeneratePayslip = async () => {
    if (!salaryResult || !selectedEmployeeId) return;

    setGenLoading(true);
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const adminName = adminData.admin_name || 'Admin';

    const result = await generatePayslip(
      companyId,
      selectedEmployeeId,
      salaryMonth,
      adminName
    );

    if (result.success) {
      alert(`Payslip for ${selectedEmployee?.name || selectedEmployeeId} generated successfully!`);
      setSalaryResult(null); // Clear after success
    } else {
      alert(`Failed to generate payslip: ${result.error}`);
    }
    setGenLoading(false);
  };

  if (loading) {
    return <div className="page-loading">Loading payroll & tax dashboard...</div>;
  }

  return (
    <div className="page-shell payroll-shell">
      <div className="payroll-header">
        <div className="payroll-brand">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="payroll-logo-button"
            aria-label="Back to admin menu"
          >
            {adminInfo.company_name?.charAt(0)?.toUpperCase() || <ArrowLeft size={20} />}
          </button>
          <div>
            <h1 className="payroll-company-name">{adminInfo.company_name || 'Victus Company'}</h1>
            <p className="payroll-subtitle">
              Payroll Dashboard - {new Date(`${salaryMonth}-01`).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="payroll-header-actions">
          <button type="button" className="payroll-sync-button" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Sync
          </button>
          <button type="button" className="payroll-run-button" onClick={handleCalculateSalary} disabled={calcLoading || !selectedEmployeeId}>
            <Download size={16} />
            Run Payroll
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="page-grid-2">
          <section className="panel panel-card panel-highlight">
            <div className="panel-row">
              <div className="panel-row-icon">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="panel-title">Admin payroll snapshot</p>
                <p className="panel-note">View company payroll readiness and submitted declarations.</p>
              </div>
            </div>

            <div className="detail-block">
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span className="text-sm">Employees</span>
                  <strong>{employees.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span className="text-sm">Tax declarations</span>
                  <strong>{taxDeclarations.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span className="text-sm">Current month</span>
                  <strong>{salaryMonth}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="panel panel-card panel-main">
            <div className="panel-heading">
              <div>
                <h2 className="panel-title">Calculate salary</h2>
                <p className="panel-note">Choose an employee and month to review estimated payout.</p>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-field">
                <label className="text-sm font-semibold mb-2">Employee</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="input-select"
                >
                  <option value="">Select an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.employee_id} value={employee.employee_id}>
                      {employee.name || employee.employee_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="panel-field">
                <label className="text-sm font-semibold mb-2">Salary month</label>
                <input
                  type="month"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="input-field"
                />
              </div>

              {error && (
                <div style={{ color: '#b91c1c', fontSize: '0.95rem' }}>{error}</div>
              )}

              <button
                type="button"
                onClick={handleCalculateSalary}
                className="button-primary button-full"
                disabled={calcLoading}
                style={{ justifyContent: 'center', gap: '10px' }}
              >
                <DollarSign size={18} />
                {calcLoading ? 'Calculating...' : 'Calculate Salary'}
              </button>
            </div>

            {salaryResult && (
              <div className="panel-card" style={{ borderRadius: '20px', background: '#f8fafc' }}>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p className="panel-title">Estimated net salary</p>
                      <p className="panel-note">{selectedEmployee?.name || selectedEmployeeId}</p>
                    </div>
                    <strong style={{ fontSize: '1.4rem', color: '#0f172a' }}>₹{salaryResult.net_salary?.toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'grid', gap: '8px', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Gross salary</span>
                      <span>₹{salaryResult.gross_salary?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total deductions</span>
                      <span>₹{salaryResult.total_deductions?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Present days</span>
                      <span>{salaryResult.present_days}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Overtime hours</span>
                      <span>{salaryResult.overtime_hours}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGeneratePayslip}
                    className="button-primary button-full"
                    disabled={genLoading}
                    style={{ 
                      marginTop: '16px', 
                      background: '#10b981', 
                      borderColor: '#10b981',
                      justifyContent: 'center', 
                      gap: '10px' 
                    }}
                  >
                    <ListChecks size={18} />
                    {genLoading ? 'Posting Payslip...' : 'Generate & Post Payslip'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="panel panel-card panel-aside" style={{ marginTop: '24px' }}>
          <div className="panel-heading">
            <div>
              <h2 className="panel-title">Tax declarations</h2>
              <p className="panel-note">Review submitted declarations across the company.</p>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              <ListChecks size={18} />
              {filteredDeclarations.length} declaration(s)
            </div>
          </div>

          <div className="panel-field" style={{ maxWidth: '360px' }}>
            <label className="text-sm font-semibold mb-2">Filter by employee</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="input-select"
            >
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee.employee_id} value={employee.employee_id}>
                  {employee.name || employee.employee_id}
                </option>
              ))}
            </select>
          </div>

          <div className="list-card">
            {filteredDeclarations.length > 0 ? (
              filteredDeclarations.map((item) => (
                <article key={`${item.employee_id}-${item.financial_year}-${item.submission_date}`} className="list-item">
                  <div>
                    <p className="list-item-title">{item.financial_year}</p>
                    <div className="list-item-meta">
                      <span>{item.employee_id}</span>
                      <span>{item.status || 'Submitted'}</span>
                    </div>
                    <p className="list-item-highlight">
                      Total deductions ₹{(
                        Number(item.section_80c || 0) +
                        Number(item.section_80d || 0) +
                        Number(item.section_80e || 0) +
                        Number(item.other_deductions || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gap: '8px', textAlign: 'right' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Filed: {item.submission_date}
                    </span>
                    <button 
                      type="button" 
                      className="button-outline button-outline-success" 
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      onClick={() => setSelectedDeclaration(item)}
                    >
                      View
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">No tax declarations found for the selected employee.</div>
            )}
          </div>
        </section>
      </div>

      {/* Tax Declaration Detail Modal */}
      {selectedDeclaration && (
        <div className="payroll-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="payroll-modal panel panel-card" style={{
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <div className="payroll-modal-header panel-heading" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h2 className="panel-title">Tax Declaration</h2>
                <p className="panel-note">Financial Year {selectedDeclaration.financial_year}</p>
              </div>
              <button 
                onClick={() => setSelectedDeclaration(null)}
                className="payroll-modal-close icon-button"
                style={{ position: 'absolute', top: '16px', right: '16px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div className="panel-card" style={{ background: '#f8fafc', border: 'none' }}>
                <p className="text-xs text-slate-500 mb-1">Employee ID</p>
                <p className="font-bold text-slate-900">{selectedDeclaration.employee_id}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="panel-card" style={{ background: '#f8fafc', border: 'none' }}>
                  <p className="text-xs text-slate-500 mb-1">Submission Date</p>
                  <p className="font-semibold text-slate-700">{selectedDeclaration.submission_date}</p>
                </div>
                <div className="panel-card" style={{ background: '#f0fdf4', border: 'none' }}>
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <p className="font-bold text-emerald-700">{selectedDeclaration.status || 'Submitted'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Breakdown</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-slate-600">Section 80C</span>
                    <span className="font-semibold">₹{Number(selectedDeclaration.section_80c || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-slate-600">Section 80D</span>
                    <span className="font-semibold">₹{Number(selectedDeclaration.section_80d || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-slate-600">Section 80E</span>
                    <span className="font-semibold">₹{Number(selectedDeclaration.section_80e || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-slate-600">Other Deductions</span>
                    <span className="font-semibold">₹{Number(selectedDeclaration.other_deductions || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 mt-1" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong className="text-slate-900">Total Savings</strong>
                    <strong className="text-sky-600 text-lg">
                      ₹{(
                        Number(selectedDeclaration.section_80c || 0) +
                        Number(selectedDeclaration.section_80d || 0) +
                        Number(selectedDeclaration.section_80e || 0) +
                        Number(selectedDeclaration.other_deductions || 0)
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setSelectedDeclaration(null)}
                className="button-primary button-full" 
                style={{ marginTop: '12px', justifyContent: 'center' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollTaxManagement;
