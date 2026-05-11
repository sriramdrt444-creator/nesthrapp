import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, User, Mail, Lock, AlertCircle, RefreshCcw, Save, Upload } from 'lucide-react';
import { getEmployeeById, updateCompanyEmployee, getCompanyBranches } from '../../supabaseHelpers';
import '../../index.css';

const EditEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Personal Info
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  
  // Professional Info
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [cadre, setCadre] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [basicSalary, setBasicSalary] = useState('0');
  const [hra, setHra] = useState('0');
  const [da, setDa] = useState('0');
  const [specialAllowance, setSpecialAllowance] = useState('0');
  const [bonusIncentives, setBonusIncentives] = useState('0');
  const [overtimeRate, setOvertimeRate] = useState('0');
  const [ctc, setCtc] = useState('0');
  const [pfNumber, setPfNumber] = useState('');
  const [esiNumber, setEsiNumber] = useState('');
  
  // Identity & Recognition
  const [identityNumber, setIdentityNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [punchingNumber, setPunchingNumber] = useState('');
  
  // Branch & Address
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState([]);
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  
  // Family Info
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  
  // Login Info
  const [role, setRole] = useState('Employee');
  const [photoUrl, setPhotoUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Account');

  const TABS = ['Account', 'Personal', 'Professional', 'Salary', 'Emergency'];

  useEffect(() => {
    // Scroll content to top when tab changes
    const contentArea = document.querySelector('.app-content');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
  }, [activeTab]);

  useEffect(() => {
    const loadData = async () => {
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      if (!adminData || !adminData.company_id) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const [branchesResult, employeeResult] = await Promise.all([
          getCompanyBranches(adminData.company_id),
          getEmployeeById(adminData.company_id, id),
        ]);

        if (branchesResult.success) {
          setBranches(branchesResult.branches || []);
        }

        if (employeeResult.success) {
          const emp = employeeResult.employee;
          setEmployeeId(emp.employee_id);
          setName(emp.name || '');
          setEmail(emp.email || '');
          setPhone(emp.phone_number || '');
          setGender(emp.gender || '');
          setDateOfBirth(emp.date_of_birth || '');
          setMaritalStatus(emp.marital_status || '');
          setDesignation(emp.designation || '');
          setDepartment(emp.department || '');
          setCadre(emp.cadre || '');
          setEmploymentType(emp.employment_type || 'Full-time');
          setDateOfJoining(emp.date_of_joining || '');
          setBasicSalary(emp.basic_salary?.toString() || '0');
          setHra(emp.hra?.toString() || '0');
          setDa(emp.da?.toString() || '0');
          setSpecialAllowance(emp.special_allowance?.toString() || '0');
          setBonusIncentives(emp.bonus_incentives?.toString() || '0');
          setOvertimeRate(emp.overtime_rate?.toString() || '0');
          setCtc(emp.ctc?.toString() || '0');
          setPfNumber(emp.pf_number || '');
          setEsiNumber(emp.esi_number || '');
          setIdentityNumber(emp.employee_identity_number || '');
          setAadharNumber(emp.aadhar_number || '');
          setPunchingNumber(emp.punching_recognition_number || '');
          setBranchId(emp.branch_id || '');
          setPermanentAddress(emp.permanent_address || '');
          setCurrentAddress(emp.current_address || '');
          setFatherName(emp.father_name || '');
          setMotherName(emp.mother_name || '');
          setEmergencyContactName(emp.emergency_contact_name || '');
          setEmergencyContactNumber(emp.emergency_contact_number || '');
          setRole(emp.role || 'Employee');
          setPhotoUrl(emp.photo_url || '');
        } else {
          setError('Employee not found or error loading data.');
        }
      } catch (error) {
        console.error('Error loading employee data:', error);
        setError('Error loading employee data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (!adminData || !adminData.company_id) {
      setError('Admin session not found. Please login again.');
      navigate('/login');
      return;
    }

    setSaving(true);
    setError('');

    // Validate phone number (10 digits)
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setError('Phone number must be a valid 10-digit mobile number (starting with 6-9).');
      setSaving(false);
      return;
    }
    if (emergencyContactNumber && !/^[6-9]\d{9}$/.test(emergencyContactNumber)) {
      setError('Emergency contact number must be a valid 10-digit mobile number.');
      setSaving(false);
      return;
    }

    try {
      const employeeData = {
        name: name,
        email: email,
        phone_number: phone,
        role: role,
        designation: designation,
        department: department,
        cadre: cadre,
        employment_type: employmentType,
        date_of_joining: dateOfJoining,
        basic_salary: parseFloat(basicSalary) || 0,
        hra: parseFloat(hra) || 0,
        da: parseFloat(da) || 0,
        special_allowance: parseFloat(specialAllowance) || 0,
        bonus_incentives: parseFloat(bonusIncentives) || 0,
        overtime_rate: parseFloat(overtimeRate) || 0,
        ctc: parseFloat(ctc) || 0,
        pf_number: pfNumber,
        esi_number: esiNumber || null,
        employee_identity_number: identityNumber?.trim() || null,
        aadhar_number: aadharNumber?.trim() || null,
        punching_recognition_number: punchingNumber?.trim() || null,
        branch_id: branchId || null,
        gender: gender,
        date_of_birth: dateOfBirth || null,
        marital_status: maritalStatus || null,
        permanent_address: permanentAddress || null,
        current_address: currentAddress || null,
        father_name: fatherName || null,
        mother_name: motherName,
        emergency_contact_name: emergencyContactName,
        emergency_contact_number: emergencyContactNumber,
        photo_url: photoUrl,
      };

      const result = await updateCompanyEmployee(adminData.company_id, id, employeeData);
      if (result.success) {
        alert('Employee updated successfully!');
        navigate('/admin/employee');
      } else {
        setError('Failed to update employee: ' + result.error);
      }
    } catch (error) {
      setError('Error updating employee: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--light-bg)' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading employee data...</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-bg)' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#F8FAFC', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #E2E8F0' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px' }} 
          onClick={() => navigate('/admin/employee')}
        >
          <ChevronLeft size={18} />
          <span>Back to Employee List</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', backgroundColor: 'var(--zoho-blue)', borderRadius: '10px', color: 'white' }}>
            <User size={20} />
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 'var(--font-semibold)', margin: 0, color: 'var(--dark-navy)' }}>Edit Employee: {employeeId}</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="app-content" style={{ overflowY: 'auto' }}>
        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: '#991B1B', fontSize: '14px' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0px', padding: '16px' }}>
          
          {/* TABS NAVIGATION */}
          <div className="form-tabs-container">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`form-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ACCOUNT TAB */}
          {activeTab === 'Account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Account Details</h3>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Employee ID (Fixed)</label>
                  <div className="input-wrapper" style={{ backgroundColor: '#F1F5F9' }}>
                    <User size={18} className="input-icon" />
                    <input 
                      type="text" 
                      className="input-field" 
                      value={employeeId}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Email Address *</label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input 
                      type="email" 
                      className="input-field" 
                      placeholder="arun@nesthr.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">System Role</label>
                  <select 
                    className="input-field" 
                    style={{ paddingLeft: '16px' }}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Profile Photo</label>
                  <div style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      id="photo-upload"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setPhotoUrl(event.target.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label htmlFor="photo-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Upload size={24} style={{ color: '#64748B' }} />
                      {photoUrl ? (
                        <>
                          <img src={photoUrl} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0' }} />
                          <span style={{ fontSize: '12px', color: '#64748B' }}>Click to change photo</span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>Click to upload profile photo</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>PNG, JPG up to 5MB</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PERSONAL TAB */}
          {activeTab === 'Personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Personal Information</h3>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Full Name *</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Arun Kumar" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Gender</label>
                  <select 
                    className="input-field" 
                    style={{ paddingLeft: '16px' }}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Date of Birth</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Marital Status</label>
                  <select 
                    className="input-field" 
                    style={{ paddingLeft: '16px' }}
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Family Information</h3>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Father's Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Father's name" 
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Mother's Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Mother's name" 
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Address Information</h3>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Permanent Address</label>
                  <textarea 
                    className="input-field" 
                    placeholder="Permanent address" 
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    rows="3"
                    style={{ paddingLeft: '16px', paddingRight: '16px', resize: 'vertical' }}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Current Address</label>
                  <textarea 
                    className="input-field" 
                    placeholder="Current address" 
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    rows="3"
                    style={{ paddingLeft: '16px', paddingRight: '16px', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PROFESSIONAL TAB */}
          {activeTab === 'Professional' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Professional Information</h3>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Designation</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Software Engineer" 
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Department</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Engineering" 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Cadre</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Senior" 
                    value={cadre}
                    onChange={(e) => setCadre(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Employment Type</label>
                  <select 
                    className="input-field" 
                    style={{ paddingLeft: '16px' }}
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Date of Joining</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Branch</label>
                  <select 
                    className="input-field" 
                    style={{ paddingLeft: '16px' }}
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Identity & Recognition</h3>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Employee Identity Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. EMPID001" 
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Aadhar Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="XXXX XXXX XXXX" 
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Punching Recognition Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. PUNCH001" 
                    value={punchingNumber}
                    onChange={(e) => setPunchingNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SALARY TAB */}
          {activeTab === 'Salary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Salary Structure</h3>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Basic Salary</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    placeholder="0.00"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">HRA</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    placeholder="0.00"
                    value={hra}
                    onChange={(e) => setHra(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">DA</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    placeholder="0.00"
                    value={da}
                    onChange={(e) => setDa(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Special Allowance</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    placeholder="0.00"
                    value={specialAllowance}
                    onChange={(e) => setSpecialAllowance(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Bonus / Incentives</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    placeholder="0.00"
                    value={bonusIncentives}
                    onChange={(e) => setBonusIncentives(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Overtime Rate</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    placeholder="0.00"
                    value={overtimeRate}
                    onChange={(e) => setOvertimeRate(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Annual CTC</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    placeholder="0.00"
                    value={ctc}
                    onChange={(e) => setCtc(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">PF Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="PF Number"
                    value={pfNumber}
                    onChange={(e) => setPfNumber(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">ESI Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="ESI Number"
                    value={esiNumber}
                    onChange={(e) => setEsiNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* EMERGENCY TAB */}
          {activeTab === 'Emergency' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Emergency Contact</h3>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Emergency Contact Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Name" 
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Emergency Contact Number</label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="10-digit mobile number"
                    value={emergencyContactNumber}
                    onChange={(e) => setEmergencyContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="form-navigation-footer">
            {activeTab !== 'Account' && (
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: '14px', borderRadius: '12px' }}
                onClick={() => {
                  const currentIndex = TABS.indexOf(activeTab);
                  setActiveTab(TABS[currentIndex - 1]);
                }}
              >
                Previous
              </button>
            )}
            
            {activeTab !== 'Emergency' ? (
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 2, padding: '14px', borderRadius: '12px' }}
                onClick={() => {
                  setError('');
                  const currentIndex = TABS.indexOf(activeTab);
                  setActiveTab(TABS[currentIndex + 1]);
                }}
              >
                Next
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ flex: 2, padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                disabled={saving}
              >
                {saving ? 'Updating...' : (
                  <>
                    <Save size={18} /> Update Employee Record
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;
