import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2, FileText, Upload, AlertCircle } from 'lucide-react';
import { registerCompany } from '../../supabaseHelpers';
import '../../index.css';

const CreateCompany = () => {
  const navigate = useNavigate();
  
  // Company Details
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  
  // Branch Details
  const [branch, setBranch] = useState('');
  const [branchHead, setBranchHead] = useState('');
  
  // Admin Details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Company');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempAdminId, setTempAdminId] = useState('');

  const TABS = ['Company', 'Contact', 'Location', 'Admin Account'];

  useEffect(() => {
    // Scroll content to top when tab changes
    const contentArea = document.querySelector('.app-content');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
  }, [activeTab]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompanyLogo(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    if (!registrationNumber.trim()) {
      setError('Registration number is required.');
      return;
    }

    if (!licenseNumber.trim()) {
      setError('License number is required.');
      return;
    }

    if (!email.includes('@')) {
      setError('Valid company email is required.');
      return;
    }

    if (!adminName.trim()) {
      setError('Admin name is required.');
      return;
    }

    if (!adminEmail.includes('@')) {
      setError('Valid admin email is required.');
      return;
    }

    if (adminPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const companyData = {
        name: companyName,
        registration_number: registrationNumber,
        license_number: licenseNumber,
        gst_number: gstNumber,
        email: email,
        phone: phone,
        website: website,
        industry: industry,
        employee_count: parseInt(employeeCount) || 0,
        address: address,
        city: city,
        state: state,
        zip_code: zipCode,
        branch_name: branch,
        branch_head: branchHead,
        company_logo: logoPreview, // Base64 encoded image
      };

      const adminData = {
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
      };

      const result = await registerCompany(companyData, adminData);
      if (result.success) {
        setTempAdminId(result.admin_id);
        
        // Call server to send actual SMTP email
        try {
          await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, purpose: 'registration' }),
          });
          setShowOtp(true);
        } catch (err) {
          setError('Company registered, but failed to send verification email. Please contact support.');
          setShowOtp(true); // Still show OTP field in case they want to try manually
        }
      } else {
        setError('Failed to register company: ' + result.error);
      }
    } catch (error) {
      setError('Error registering company: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, purpose: 'registration', otp: otp }),
      });
      const data = await response.json();

      if (data.success) {
        alert('Registration verified! Admin ID: ' + tempAdminId);
        navigate('/login');
      } else {
        setError(data.error || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      setError('Error verifying code. Is the server running?');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-bg)' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#F8FAFC', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #E2E8F0' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px' }} 
          onClick={() => navigate('/login')}
        >
          <ChevronLeft size={18} />
          <span>Back to Login</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', backgroundColor: 'var(--green)', borderRadius: '10px', color: 'white' }}>
            <Building2 size={20} />
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 'var(--font-semibold)', margin: 0, color: 'var(--dark-navy)' }}>Company Registration</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="app-content" style={{ overflowY: 'auto' }}>
        {showOtp ? (
          <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '32px', borderRadius: '24px' }}>
              <div style={{ backgroundColor: '#10B981', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white' }}>
                <AlertCircle size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', marginBottom: '8px' }}>Verify Registration</h2>
              <p style={{ fontSize: '15px', color: '#64748B', marginBottom: '32px' }}>
                We've sent a verification code to <br /> <strong>{adminEmail}</strong>
              </p>

              {error && (
                <div style={{ padding: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '8px', display: 'block' }}>Enter OTP Code</label>
                  <input 
                    type="text" 
                    placeholder="123456" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '20px', textAlign: 'center', letterSpacing: '8px', fontWeight: '700' }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: '700' }}
                >
                  Verify & Complete
                </button>
              </form>
              
              <button 
                onClick={() => setShowOtp(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '14px', fontWeight: '600', marginTop: '24px', cursor: 'pointer' }}
              >
                Back to Registration
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0px', padding: '16px' }}>
            
            {error && (
              <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' }}>
                <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: '#991B1B', fontSize: '14px' }}>{error}</span>
              </div>
            )}

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
            
            {/* COMPANY TAB */}
            {activeTab === 'Company' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ paddingBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Company Details</h3>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Company Name *</label>
                    <div className="input-wrapper">
                      <Building2 size={18} className="input-icon" />
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Acme Corporation" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Registration Number *</label>
                    <div className="input-wrapper">
                      <FileText size={18} className="input-icon" />
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. REG123456" 
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">License Number *</label>
                    <div className="input-wrapper">
                      <FileText size={18} className="input-icon" />
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. LIC123456" 
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">GST Number</label>
                    <div className="input-wrapper">
                      <FileText size={18} className="input-icon" />
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. 27AABCU9603R1Z0" 
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Company Logo</label>
                    <div style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#F8FAFC'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }} 
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Upload size={24} style={{ color: '#64748B' }} />
                        {logoPreview ? (
                          <>
                            <img src={logoPreview} alt="Logo Preview" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '4px' }} />
                            <span style={{ fontSize: '12px', color: '#64748B' }}>Click to change</span>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>Click to upload logo</span>
                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>PNG, JPG, GIF up to 10MB</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTACT TAB */}
            {activeTab === 'Contact' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ paddingBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Communication Details</h3>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Email Address *</label>
                    <div className="input-wrapper">
                      <input 
                        type="email" 
                        className="input-field" 
                        placeholder="company@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Phone Number</label>
                    <div className="input-wrapper">
                      <input 
                        type="tel" 
                        className="input-field" 
                        placeholder="+91 XXXXX XXXXX" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Website</label>
                    <div className="input-wrapper">
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="https://example.com" 
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Industry Type</label>
                    <select 
                      className="input-field" 
                      style={{ paddingLeft: '16px' }}
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    >
                      <option value="">Select Industry</option>
                      <option value="IT">Information Technology</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Retail">Retail</option>
                      <option value="Education">Education</option>
                      <option value="Finance">Finance & Banking</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Employee Count</label>
                    <div className="input-wrapper">
                      <input 
                        type="number" 
                        className="input-field" 
                        placeholder="100" 
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LOCATION TAB */}
            {activeTab === 'Location' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Address Details</h3>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Address</label>
                    <textarea 
                      className="input-field" 
                      placeholder="Full address" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows="3"
                      style={{ paddingLeft: '16px', paddingRight: '16px', resize: 'vertical' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">City</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Mumbai" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">State</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Maharashtra" 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Zip Code</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. 400001" 
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ paddingBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Branch Details (Head Office)</h3>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Branch Name</label>
                    <div className="input-wrapper">
                      <Building2 size={18} className="input-icon" />
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Head Office" 
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Branch Head Name</label>
                    <div className="input-wrapper">
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Branch head name" 
                        value={branchHead}
                        onChange={(e) => setBranchHead(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN TAB */}
            {activeTab === 'Admin Account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ paddingBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Administrator Account</h3>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Admin Name *</label>
                    <div className="input-wrapper">
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Your full name" 
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Admin Email *</label>
                    <div className="input-wrapper">
                      <input 
                        type="email" 
                        className="input-field" 
                        placeholder="admin@example.com" 
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Admin Phone</label>
                    <div className="input-wrapper">
                      <input 
                        type="tel" 
                        className="input-field" 
                        placeholder="+91 XXXXX XXXXX" 
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Password *</label>
                    <div className="input-wrapper">
                      <input 
                        type="password" 
                        className="input-field" 
                        placeholder="Enter password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Confirm Password *</label>
                    <div className="input-wrapper">
                      <input 
                        type="password" 
                        className="input-field" 
                        placeholder="Confirm password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NAVIGATION BUTTONS */}
            <div className="form-navigation-footer">
              {activeTab !== 'Company' && (
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
              
              {activeTab !== 'Admin Account' ? (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 2, padding: '14px', borderRadius: '12px' }}
                  onClick={() => {
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
                  style={{ flex: 2, padding: '14px', borderRadius: '12px' }} 
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateCompany;
