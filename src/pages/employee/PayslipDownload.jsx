import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, Filter, ArrowLeft } from 'lucide-react';
import supabaseHelpers from '../../supabaseHelpers';

export default function PayslipDownload() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [filteredPayslips, setFilteredPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    loadPayslips();
  }, [yearFilter]);

  const loadPayslips = async () => {
    try {
      const employeeData = JSON.parse(localStorage.getItem('employeeData'));
      if (!employeeData) {
        navigate('/login');
        return;
      }

      setEmployee(employeeData);

      const { payslips: slips, success } = await supabaseHelpers.getEmployeePayslipsForSelfService(
        employeeData.company_id,
        employeeData.employee_id
      );

      if (success && slips) {
        setPayslips(slips);
        const filtered = slips.filter((slip) => {
          const slipYear = new Date(slip.salary_month).getFullYear();
          return slipYear === yearFilter;
        });
        setFilteredPayslips(filtered);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading payslips:', error);
      setLoading(false);
    }
  };

  const downloadPayslip = async (payslip) => {
    try {
      await supabaseHelpers.recordPayslipAccess(
        employee.company_id,
        employee.employee_id,
        payslip.payslip_id
      );

      const pdfContent = generatePayslipPDF(payslip);
      const element = document.createElement('a');
      element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(pdfContent);
      element.download = `Payslip_${new Date(payslip.salary_month).toISOString().slice(0, 10)}.txt`;
      element.click();
    } catch (error) {
      console.error('Error downloading payslip:', error);
    }
  };

  const generatePayslipPDF = (payslip) => {
    const month = new Date(payslip.salary_month).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
    return `PAYSLIP - ${month}
================================
Employee: ${employee.name || employee.employee_name}
Employee ID: ${employee.employee_id}
Company: ${employee.company_name}

EARNINGS:
Basic Salary: ₹${payslip.basic_salary?.toFixed(2) || 0}
HRA: ₹${payslip.hra?.toFixed(2) || 0}
DA: ₹${payslip.da?.toFixed(2) || 0}
Special Allowance: ₹${payslip.special_allowance?.toFixed(2) || 0}
Total Earnings: ₹${payslip.total_earnings?.toFixed(2) || 0}

DEDUCTIONS:
PF: ₹${payslip.pf_amount?.toFixed(2) || 0}
ESI: ₹${payslip.esi_amount?.toFixed(2) || 0}
Professional Tax: ₹${payslip.professional_tax?.toFixed(2) || 0}
TDS: ₹${payslip.tds_amount?.toFixed(2) || 0}
Total Deductions: ₹${payslip.total_deductions?.toFixed(2) || 0}

NET SALARY: ₹${payslip.net_salary?.toFixed(2) || 0}
================================
Generated on: ${new Date().toLocaleDateString()}`;
  };

  const viewPayslipDetails = (payslip) => {
    setSelectedPayslip(payslip);
  };

  const availableYears = Array.from(
    new Set(payslips.map((slip) => new Date(slip.salary_month).getFullYear()))
  ).sort((a, b) => b - a);

  if (loading) {
    return <div className="page-loading">Loading payslips...</div>;
  }

  return (
    <div className="page-shell">
      <header className="page-header shift-for-menu">
        <button type="button" onClick={() => navigate('/employee/dashboard')} className="icon-button">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="page-label">Payslip Center</p>
          <h1 className="page-title">My Payslips</h1>
        </div>
      </header>

      <div className="page-content">
        <div className="content-grid content-grid-3">
          <section className="panel panel-card panel-highlight">
            <div className="panel-row">
              <div className="panel-row-icon">
                <Filter size={18} />
              </div>
              <div>
                <p className="panel-title">Filter payslips</p>
                <p className="panel-note">Select the year to view payslips.</p>
              </div>
            </div>
            <div className="panel-field">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(parseInt(e.target.value, 10))}
                className="input-select"
              >
                {availableYears.length > 0
                  ? availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))
                  : [new Date().getFullYear()].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
              </select>
            </div>
          </section>

          <section className="panel panel-card panel-main">
            <div className="panel-heading">
              <div>
                <h2 className="panel-title">Payslips</h2>
                <p className="panel-note">{filteredPayslips.length} payslip(s) found for {yearFilter}</p>
              </div>
            </div>
            <div className="list-card">
              {filteredPayslips.length > 0 ? (
                filteredPayslips.map((payslip) => (
                  <article key={payslip.payslip_id} className="list-item">
                    <div>
                      <p className="list-item-title">
                        {new Date(payslip.salary_month).toLocaleString('default', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <div className="list-item-meta">
                        <span>Gross ₹{payslip.total_earnings?.toFixed(2) || 0}</span>
                        <span>Deductions ₹{payslip.total_deductions?.toFixed(2) || 0}</span>
                      </div>
                      <p className="list-item-highlight">Net ₹{payslip.net_salary?.toFixed(2) || 0}</p>
                    </div>
                    <div className="list-item-actions">
                      <button type="button" className="button-outline" onClick={() => viewPayslipDetails(payslip)}>
                        <Eye size={16} /> View
                      </button>
                      <button type="button" className="button-outline button-outline-success" onClick={() => downloadPayslip(payslip)}>
                        <Download size={16} /> Download
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">No payslips available for {yearFilter}</div>
              )}
            </div>
          </section>

          {selectedPayslip && (
            <aside className="panel panel-card panel-aside">
              <div className="panel-heading">
                <div>
                  <h2 className="panel-title">Details</h2>
                  <p className="panel-note">{new Date(selectedPayslip.salary_month).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="detail-block">
                <p className="detail-group-title">Earnings</p>
                <div className="detail-grid">
                  <DetailRow label="Basic" value={selectedPayslip.basic_salary} />
                  <DetailRow label="HRA" value={selectedPayslip.hra} />
                  <DetailRow label="DA" value={selectedPayslip.da} />
                  <DetailRow label="Special" value={selectedPayslip.special_allowance} />
                  <DetailRow label="Gross" value={selectedPayslip.total_earnings} bold />
                </div>
              </div>

              <div className="detail-block">
                <p className="detail-group-title">Deductions</p>
                <div className="detail-grid">
                  <DetailRow label="PF" value={selectedPayslip.pf_amount} />
                  <DetailRow label="ESI" value={selectedPayslip.esi_amount} />
                  <DetailRow label="Professional Tax" value={selectedPayslip.professional_tax} />
                  <DetailRow label="TDS" value={selectedPayslip.tds_amount} />
                  <DetailRow label="Total" value={selectedPayslip.total_deductions} bold />
                </div>
              </div>

              <div className="detail-summary">
                <span>Net Salary</span>
                <strong>₹{selectedPayslip.net_salary?.toFixed(2) || 0}</strong>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, bold }) {
  return (
    <div className={`detail-row ${bold ? 'detail-row-bold' : ''}`}>
      <span>{label}</span>
      <span>₹{value?.toFixed(2) || '0.00'}</span>
    </div>
  );
}
