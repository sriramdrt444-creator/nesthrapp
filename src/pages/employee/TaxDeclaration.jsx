import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, FileText, ArrowLeft, Info } from 'lucide-react';
import supabaseHelpers from '../../supabaseHelpers';

export default function TaxDeclaration() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const currentYear = new Date().getFullYear();
  const financialYear = `${currentYear - 1}-${currentYear.toString().slice(-2)}`;

  const [formData, setFormData] = useState({
    financialYear: financialYear,
    section80c: 0, // Life Insurance, PPF
    section80d: 0, // Health Insurance
    section80e: 0, // Education Loan Interest
    otherDeductions: 0,
    documents: [],
  });

  const sections = [
    {
      code: '80C',
      name: 'Section 80C',
      description: 'Life Insurance Premiums, PPF, Mutual Funds, Home Loan Principal',
      limit: 150000,
    },
    {
      code: '80D',
      name: 'Section 80D',
      description: 'Health Insurance Premium (Self/Family)',
      limit: 75000,
    },
    {
      code: '80E',
      name: 'Section 80E',
      description: 'Education Loan Interest',
      limit: 0, // No limit
    },
  ];

  useEffect(() => {
    loadTaxDeclarations();
  }, []);

  const loadTaxDeclarations = async () => {
    try {
      const employeeData = JSON.parse(localStorage.getItem('employeeData'));
      if (!employeeData) {
        navigate('/login');
        return;
      }

      setEmployee(employeeData);
      
      const res = await supabaseHelpers.getEmployeeTaxDeclarations(employeeData.company_id, employeeData.employee_id);
      if (res.success) {
        setDeclarations(res.declarations || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading tax declarations:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...files],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate total deductions don't exceed limits
      const totalDeductions =
        formData.section80c + formData.section80d + formData.section80e + formData.otherDeductions;

      if (totalDeductions <= 0) {
        alert('Please enter at least one deduction amount');
        return;
      }

      // Submit tax declaration
      const result = await supabaseHelpers.submitTaxDeclaration(
        employee.company_id,
        employee.employee_id,
        {
          financialYear: formData.financialYear,
          section80c: formData.section80c,
          section80d: formData.section80d,
          section80e: formData.section80e,
          otherDeductions: formData.otherDeductions,
          documents: formData.documents,
        }
      );

      if (result.success) {
        alert('Tax declaration submitted successfully!');
        setShowForm(false);
        setFormData({
          financialYear: financialYear,
          section80c: 0,
          section80d: 0,
          section80e: 0,
          otherDeductions: 0,
          documents: [],
        });
        loadTaxDeclarations();
      } else {
        alert(`Error submitting tax declaration: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting tax declaration:', error);
      alert('Error submitting tax declaration: ' + error.message);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading tax declarations...</div>;
  }

  const totalDeductions =
    formData.section80c + formData.section80d + formData.section80e + formData.otherDeductions;

  return (
    <div className="page-shell">
      <div className="page-header">
        <button
          type="button"
          onClick={() => navigate('/employee/dashboard')}
          className="icon-button"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="page-label">Tax Declaration</p>
          <h1 className="page-title">File your tax declaration</h1>
        </div>
      </div>

      <div className="page-content">
        <div className="page-grid-2">
          <section className="panel panel-card panel-highlight">
            <div className="panel-row">
              <div className="panel-row-icon">
                <Info size={20} />
              </div>
              <div>
                <p className="panel-title">Tax Saving Sections</p>
                <p className="panel-note">Review approved deduction limits before filing.</p>
              </div>
            </div>

            <div className="detail-block">
              {sections.map((section) => (
                <div key={section.code} className="panel-card" style={{ padding: '16px', background: '#f8fbff' }}>
                  <p className="font-bold text-slate-900">{section.name}</p>
                  <p className="text-sm text-slate-600 mt-1">{section.description}</p>
                  {section.limit > 0 && (
                    <p className="text-sm font-semibold text-sky-600 mt-2">
                      Limit: ₹{section.limit.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="panel-card" style={{ padding: '18px', background: '#fffbeb', borderColor: '#fef3c7' }}>
              <h4 className="font-bold text-sm text-yellow-900 mb-3">Important</h4>
              <ul className="text-sm text-slate-700" style={{ lineHeight: '1.8' }}>
                <li>• Submit by end of financial year</li>
                <li>• Keep supporting documents</li>
                <li>• Declarations are used for TDS calculation</li>
                <li>• Incorrect info may attract penalties</li>
              </ul>
            </div>
          </section>

          <section className="panel panel-card panel-main">
            <div className="panel-heading">
              <div>
                <h2 className="panel-title">Declaration Form</h2>
                <p className="panel-note">Submit deduction amounts and attach proof documents.</p>
              </div>
            </div>

            {!showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="button-primary button-full"
                style={{ justifyContent: 'center', gap: '10px' }}
              >
                <FileText size={18} />
                <span>File Tax Declaration</span>
              </button>
            )}

            {showForm && (
              <div className="panel-card" style={{ gap: '24px' }}>
                <div>
                  <h3 className="text-xl font-bold mb-4">Tax Declaration - FY {financialYear}</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="panel-card" style={{ padding: '18px', gap: '18px' }}>
                    <div>
                      <h4 className="font-bold text-lg mb-2">Section 80C</h4>
                      <p className="text-sm text-slate-600 mb-3">
                        Life Insurance Premiums, PPF, Mutual Funds, Home Loan Principal, etc.
                      </p>
                      <label className="block text-sm font-semibold mb-2">Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        max="150000"
                        value={formData.section80c}
                        onChange={(e) => handleInputChange('section80c', e.target.value)}
                        placeholder="0"
                        className="input-field"
                      />
                      <p className="text-xs text-slate-500 mt-2">Maximum limit: ₹1,50,000</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-2">Section 80D</h4>
                      <p className="text-sm text-slate-600 mb-3">Health Insurance Premium</p>
                      <label className="block text-sm font-semibold mb-2">Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        max="75000"
                        value={formData.section80d}
                        onChange={(e) => handleInputChange('section80d', e.target.value)}
                        placeholder="0"
                        className="input-field"
                      />
                      <p className="text-xs text-slate-500 mt-2">Maximum limit: ₹75,000</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-2">Section 80E</h4>
                      <p className="text-sm text-slate-600 mb-3">Education Loan Interest</p>
                      <label className="block text-sm font-semibold mb-2">Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.section80e}
                        onChange={(e) => handleInputChange('section80e', e.target.value)}
                        placeholder="0"
                        className="input-field"
                      />
                      <p className="text-xs text-slate-500 mt-2">No limit</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-2">Other Deductions</h4>
                      <label className="block text-sm font-semibold mb-2">Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.otherDeductions}
                        onChange={(e) => handleInputChange('otherDeductions', e.target.value)}
                        placeholder="0"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-2">Supporting Documents</h4>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="input-field"
                        style={{ padding: '12px 14px' }}
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Upload invoices, policy copies, etc. as proof.
                      </p>
                    </div>
                  </div>

                  <div className="panel-card" style={{ padding: '20px', background: '#eff6ff' }}>
                    <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                      <div>
                        <p className="text-xs text-slate-600">Section 80C</p>
                        <p className="font-bold text-sky-600">₹{formData.section80c.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Section 80D</p>
                        <p className="font-bold text-sky-600">₹{formData.section80d.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Section 80E</p>
                        <p className="font-bold text-sky-600">₹{formData.section80e.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Other Deductions</p>
                        <p className="font-bold text-sky-600">₹{formData.otherDeductions.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="border-t" style={{ paddingTop: '18px' }}>
                      <p className="text-sm font-semibold text-slate-700">Total Tax Savings</p>
                      <p className="text-2xl font-bold text-sky-600">₹{totalDeductions.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="panel-row" style={{ gap: '12px', flexWrap: 'wrap' }}>
                    <button type="submit" className="button-primary button-wide" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <Send size={18} />
                      <span>Submit Declaration</span>
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="button-outline button-wide">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {declarations.length > 0 && (
              <div className="panel panel-card" style={{ marginTop: '24px' }}>
                <div className="panel-heading">
                  <div>
                    <h2 className="panel-title">Previous Declarations</h2>
                    <p className="panel-note">Your submitted declarations are listed below.</p>
                  </div>
                </div>
                <div className="detail-block">
                  {declarations.map((decl) => (
                    <div key={decl.declaration_id} className="panel-card" style={{ padding: '16px', borderRadius: '18px', background: '#f8fafc' }}>
                      <p className="font-bold text-slate-900">FY {decl.financial_year}</p>
                      <p className="text-sm text-slate-600 mt-2">
                        Total Amount: ₹
                        {(
                          (decl.section_80c || 0) +
                          (decl.section_80d || 0) +
                          (decl.section_80e || 0) +
                          (decl.other_deductions || 0)
                        ).toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-emerald-600 mt-2">Status: {decl.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
