import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2, Mail, Phone, MapPin, User, Lock, Eye, EyeOff } from 'lucide-react';
import { registerCompany } from '../supabaseHelpers';
import '../index.css';

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Company Details
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [website, setWebsite] = useState('');

  // Admin Details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationOtp, setVerificationOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const sendOtpEmail = async (email, purpose = 'verification') => {
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      });
      return await response.json();
    } catch (error) {
      console.error('OTP send error:', error);
      return { success: false, error: error.message || 'Unable to send OTP' };
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (currentStep === 3) {
      return;
    }
    setErrorMsg('');

    // Validate passwords
    if (adminPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match!');
      return;
    }

    if (adminPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters!');
      return;
    }

    // Validate phone numbers (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(companyPhone.replace(/\s+/g, ''))) {
      setErrorMsg('Company phone must be a valid 10-digit Indian mobile number.');
      return;
    }
    if (!phoneRegex.test(adminPhone.replace(/\s+/g, ''))) {
      setErrorMsg('Admin phone must be a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);

    try {
      // Prepare company data
      const companyData = {
        name: companyName,
        registration_number: registrationNumber,
        email: companyEmail,
        phone: companyPhone,
        website: website,
        industry: industry,
        employee_count: parseInt(employeeCount),
        address: address,
        city: city,
        state: state,
        zip_code: zipCode,
      };

      // Prepare admin data
      const adminData = {
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword, // Use bcrypt in production
      };

      // Call registration function
      const result = await registerCompany(companyData, adminData);

      if (result.success) {
        const otpResult = await sendOtpEmail(adminEmail, 'registration_verification');
        setOtpSent(otpResult.success);
        if (otpResult.success) {
          setVerificationMessage(`OTP sent to ${adminEmail}. Enter it below to complete registration.`);
        } else {
          setVerificationMessage('OTP could not be sent, please check email settings and try again.');
        }
        setCurrentStep(3);
        return;
      } else {
        setErrorMsg(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setErrorMsg(error.message || 'An error occurred during registration');
      console.error('Registration error:', error);
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
          onClick={() => navigate('/login')}
        />
        <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Register Company</h1>
      </div>

      {/* Main Content Area */}
      <div className="app-content">
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
          {/* Progress Steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: currentStep >= 1 ? 'var(--green)' : '#E2E8F0',
              color: currentStep >= 1 ? 'white' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              1
            </div>
            <div style={{ width: '40px', height: '2px', backgroundColor: currentStep >= 2 ? 'var(--green)' : '#E2E8F0' }}></div>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: currentStep >= 2 ? 'var(--green)' : '#E2E8F0',
              color: currentStep >= 2 ? 'white' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              2
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#DC2626',
              fontSize: '13px'
            }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister}>
            {currentStep === 1 ? (
              <>
                <h2 style={{ fontSize: '18px', fontWeight: 'var(--font-semibold)', marginBottom: '20px', color: 'var(--text-primary)' }}>Company Details</h2>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Company Name *</label>
                  <div className="input-wrapper">
                    <Building2 size={18} className="input-icon" />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. ABC Corporation" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Registration Number *</label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. REG-2024-001" 
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Company Email *</label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input 
                      type="email" 
                      className="input-field" 
                      placeholder="company@email.com" 
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div className="input-group" style={{ marginBottom: 0, flex: '1 1 200px', minWidth: '180px' }}>
                    <label className="input-label">Phone Number *</label>
                    <div className="input-wrapper">
                      <Phone size={18} className="input-icon" />
                      <input 
                        type="tel" 
                        className="input-field" 
                        placeholder="10-digit mobile number"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        pattern="[6-9][0-9]{9}"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0, flex: '1 1 200px', minWidth: '180px' }}>
                    <label className="input-label">Website (Optional)</label>
                    <input 
                      type="url" 
                      className="date-input" 
                      placeholder="www.example.com" 
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Industry Type *</label>
                  <select 
                    className="input-field" 
                    style={{ paddingLeft: '16px' }}
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    required
                  >
                    <option value="">-- Select Industry --</option>
                    <option value="IT">Information Technology</option>
                    <option value="Finance">Finance & Banking</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Expected Employee Count *</label>
                  <input 
                    type="number" 
                    className="date-input" 
                    placeholder="e.g. 50" 
                    min="1"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Address *</label>
                  <div className="input-wrapper">
                    <MapPin size={18} className="input-icon" />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Street address" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div className="input-group" style={{ marginBottom: 0, flex: '1 1 150px', minWidth: '120px' }}>
                    <label className="input-label">City *</label>
                    <input 
                      type="text" 
                      className="date-input" 
                      placeholder="City" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0, flex: '1 1 150px', minWidth: '120px' }}>
                    <label className="input-label">State *</label>
                    <input 
                      type="text" 
                      className="date-input" 
                      placeholder="State" 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0, flex: '1 1 150px', minWidth: '120px' }}>
                    <label className="input-label">Zip Code *</label>
                    <input 
                      type="text" 
                      className="date-input" 
                      placeholder="ZIP" 
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => setCurrentStep(2)}
                  className="btn-primary"
                  style={{ marginTop: '10px' }}
                >
                  Next: Admin Details
                </button>
              </>
            ) : currentStep === 2 ? (
              <>
                <h2 style={{ fontSize: '18px', fontWeight: 'var(--font-semibold)', marginBottom: '20px', color: 'var(--text-primary)' }}>Admin Account Details</h2>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Admin Full Name *</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. John Doe" 
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Admin Email (Login ID) *</label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input 
                      type="email" 
                      className="input-field" 
                      placeholder="admin@company.com" 
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Admin Phone *</label>
                  <div className="input-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input 
                      type="tel" 
                      className="input-field" 
                      placeholder="10-digit mobile number"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Password *</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="input-field" 
                      placeholder="••••••••" 
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      style={{ paddingLeft: '44px', letterSpacing: showPassword ? 'normal' : '2px' }}
                    />
                    <div 
                      style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Confirm Password *</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      className="input-field" 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{ paddingLeft: '44px', letterSpacing: showConfirmPassword ? 'normal' : '2px' }}
                    />
                    <div 
                      style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep(1)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid var(--green)',
                      backgroundColor: 'white',
                      color: 'var(--green)',
                      fontWeight: 'var(--font-semibold)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register Company'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '18px', fontWeight: 'var(--font-semibold)', marginBottom: '20px', color: 'var(--text-primary)' }}>Verify Account OTP</h2>

                {verificationMessage && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    backgroundColor: otpSent ? '#ECFDF5' : '#FEF3C7',
                    color: otpSent ? '#065F46' : '#92400E',
                    fontSize: '14px',
                  }}>
                    {verificationMessage}
                  </div>
                )}

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">OTP Code *</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter OTP"
                      value={verificationOtp}
                      onChange={(e) => setVerificationOtp(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={async () => {
                      if (!verificationOtp) {
                        setVerificationMessage('Please enter the OTP sent to your email.');
                        return;
                      }
                      try {
                        const response = await fetch('/api/verify-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: adminEmail, purpose: 'registration_verification', otp: verificationOtp }),
                        });
                        const data = await response.json();
                        if (!data.success) {
                          setVerificationMessage(data.error || 'OTP verification failed.');
                          return;
                        }
                        alert('Registration complete. You can now login.');
                        navigate('/login');
                      } catch (error) {
                        console.error('OTP verify error:', error);
                        setVerificationMessage('Unable to verify OTP. Please try again.');
                      }
                    }}
                  >
                    Verify OTP
                  </button>
                  <button
                    type="button"
                    style={{ flex: 1, borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: 'var(--text-primary)', cursor: 'pointer' }}
                    onClick={async () => {
                      const otpResult = await sendOtpEmail(adminEmail, 'registration_verification');
                      setOtpSent(otpResult.success);
                      if (otpResult.success) {
                        setVerificationMessage(`OTP resent to ${adminEmail}.`);
                      } else {
                        setVerificationMessage('Unable to resend OTP.');
                      }
                    }}
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )}
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Already have an account? <span onClick={() => navigate('/login')} style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: '600' }}>Sign In</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
