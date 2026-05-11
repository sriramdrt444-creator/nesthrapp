import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { allocateEmployeeToProject, getCompanyEmployees, getCompanyCustomers, getCompanyProjects } from '../../supabaseHelpers';
import '../../index.css';

const AllocateProject = () => {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [plannedDays, setPlannedDays] = useState('');
  const [expectedHours, setExpectedHours] = useState('8.5');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('400');
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      if (!adminData || !adminData.company_id) {
        navigate('/login');
        return;
      }

      try {
        const [empResult, custResult, projResult] = await Promise.all([
          getCompanyEmployees(adminData.company_id),
          getCompanyCustomers(adminData.company_id),
          getCompanyProjects(adminData.company_id)
        ]);

        if (empResult.success) setEmployees(empResult.employees);
        if (custResult.success) setCustomers(custResult.customers);
        if (projResult.success) setProjects(projResult.projects);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (!adminData || !adminData.company_id) {
      alert('Admin session not found. Please login again.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const allocationData = {
        employee_id: employeeId,
        customer_id: customerId,
        project_id: projectId,
        from_date: fromDate,
        to_date: toDate || null,
        planned_days: plannedDays ? parseInt(plannedDays) : null,
        expected_hours_per_day: parseFloat(expectedHours),
        start_time: startTime || null,
        end_time: endTime || null,
        radius_meters: parseInt(radiusMeters),
        created_by: adminData.admin_id,
      };

      const result = await allocateEmployeeToProject(adminData.company_id, allocationData);
      if (result.success) {
        alert('Employee allocated successfully!');
        navigate('/admin');
      } else {
        alert('Failed to allocate employee: ' + result.error);
      }
    } catch (error) {
      alert('Error allocating employee: ' + error.message);
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
        <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Allocate Project</h1>
      </div>

      {/* Main Content Area */}
      <div className="app-content">
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Select Employee</label>
            <select 
              className="input-field" 
              style={{ paddingLeft: '16px' }}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(employee => (
                <option key={employee.employee_id} value={employee.employee_id}>
                  {employee.employee_id} - {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Select Customer</label>
            <select 
              className="input-field" 
              style={{ paddingLeft: '16px' }}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(customer => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Select Project</label>
            <select 
              className="input-field" 
              style={{ paddingLeft: '16px' }}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
            >
              <option value="">-- Choose Project --</option>
              {projects.map(project => (
                <option key={project.project_id} value={project.project_id}>
                  {project.project_code} - {project.project_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: '1 1 200px', minWidth: '180px' }}>
              <label className="input-label">From Date</label>
              <input 
                type="date" 
                className="date-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0, flex: '1 1 200px', minWidth: '180px' }}>
              <label className="input-label">To Date (Optional)</label>
              <input 
                type="date" 
                className="date-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: '1 1 200px', minWidth: '180px' }}>
              <label className="input-label">Start Time (Optional)</label>
              <input 
                type="time" 
                className="date-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0, flex: '1 1 200px', minWidth: '180px' }}>
              <label className="input-label">End Time (Optional)</label>
              <input 
                type="time" 
                className="date-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: '1 1 200px', minWidth: '180px' }}>
              <label className="input-label">Planned Days (Optional)</label>
              <input 
                type="number" 
                className="date-input"
                placeholder="e.g. 30"
                value={plannedDays}
                onChange={(e) => setPlannedDays(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0, flex: '1 1 200px', minWidth: '180px' }}>
              <label className="input-label">Expected Hours / Day</label>
              <input 
                type="number" 
                step="0.5"
                className="date-input"
                value={expectedHours}
                onChange={(e) => setExpectedHours(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Geo-fence Radius (Meters)</label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="e.g. 400"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(e.target.value)}
              required
            />
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Employee must be within this distance to Check-In/Out. Default is 400m.
            </p>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={loading}>
            {loading ? 'Allocating...' : 'Allocate Work'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AllocateProject;
