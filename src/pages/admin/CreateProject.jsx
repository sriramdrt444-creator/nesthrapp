import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Briefcase, Hash, AlertCircle, Clock } from 'lucide-react';
import { createCompanyProject, getCompanyCustomers } from '../../supabaseHelpers';
import '../../index.css';

const CreateProject = () => {
  const navigate = useNavigate();
  const [projectCode, setProjectCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [expectedHours, setExpectedHours] = useState('8.5');
  const [customerId, setCustomerId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (adminData && adminData.company_id) {
      const result = await getCompanyCustomers(adminData.company_id);
      if (result.success) {
        setCustomers(result.customers);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (!adminData || !adminData.company_id) {
      setError('Admin session not found. Please login again.');
      navigate('/login');
      return;
    }

    // Validation
    if (!projectCode.trim()) {
      setError('Project code is required.');
      return;
    }

    if (!projectName.trim()) {
      setError('Project name is required.');
      return;
    }

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        project_code: projectCode,
        project_name: projectName,
        customer_id: customerId,
        start_time: startTime,
        end_time: endTime,
        expected_hours_per_day: parseFloat(expectedHours),
        created_by: adminData.admin_id,
      };

      const result = await createCompanyProject(adminData.company_id, projectData);
      if (result.success) {
        alert('Project created successfully!');
        navigate('/admin/project');
      } else {
        setError('Failed to create project: ' + result.error);
      }
    } catch (error) {
      setError('Error creating project: ' + error.message);
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
          onClick={() => navigate('/admin/project')}
        />
        <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Create Project</h1>
      </div>

      {/* Main Content Area */}
      <div className="app-content" style={{ overflowY: 'auto' }}>
        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: '#991B1B', fontSize: '14px' }}>{error}</span>
          </div>
        )}
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* PROJECT DETAILS SECTION */}
          <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Project Details</h3>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Project Code *</label>
              <div className="input-wrapper">
                <Hash size={18} className="input-icon" />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. PRJ-001" 
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Project Name *</label>
              <div className="input-wrapper">
                <Briefcase size={18} className="input-icon" />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. GST Filing & Accounts" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Customer *</label>
              <select 
                className="input-field" 
                style={{ paddingLeft: '16px' }}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.customer_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* WORKING HOURS SECTION */}
          <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Working Hours</h3>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ marginBottom: 0, flex: '1 1 45%', minWidth: '150px' }}>
                <label className="input-label">Start Time</label>
                <div className="input-wrapper">
                  <Clock size={18} className="input-icon" />
                  <input 
                    type="time" 
                    className="input-field" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0, flex: '1 1 45%', minWidth: '150px' }}>
                <label className="input-label">End Time</label>
                <div className="input-wrapper">
                  <Clock size={18} className="input-icon" />
                  <input 
                    type="time" 
                    className="input-field" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Expected Hours / Day</label>
              <input 
                type="number" 
                step="0.5"
                className="input-field" 
                value={expectedHours}
                onChange={(e) => setExpectedHours(e.target.value)}
                required
              />
            </div>
          </div>


          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={loading}>
            {loading ? 'Creating...' : 'Save Project'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
