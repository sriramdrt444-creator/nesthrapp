import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, MapPin } from 'lucide-react';
import { loginAdmin, loginEmployee, resetPasswordByEmail } from '../supabaseHelpers';
import '../index.css';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Employee');
  const [loginId, setLoginId] = useState('NES212345');
  const [password, setPassword] = useState('12345678');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotMessage, setForgotMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const trimmedLoginId = loginId.trim();
      const trimmedPassword = password.trim();

      if (role === 'Company') {
        const result = await loginAdmin(trimmedLoginId, trimmedPassword);
        if (!result.success) {
          setErrorMsg(result.error || 'Invalid admin credentials');
        } else {
          localStorage.removeItem('employeeData');
          localStorage.setItem('adminData', JSON.stringify(result));
          navigate('/admin');
        }
      } else {
        const result = await loginEmployee(trimmedLoginId, trimmedPassword);
        if (!result.success) {
          setErrorMsg(result.error || 'Invalid employee credentials');
        } else {
          localStorage.removeItem('adminData');
          localStorage.setItem('employeeData', JSON.stringify(result));
          navigate('/employee/dashboard');
        }
      }
    } catch (error) {
      setErrorMsg(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const sendForgotOtp = async () => {
    if (!forgotEmail) {
      setForgotMessage('Please enter your email.');
      return;
    }

    setForgotMessage('Sending OTP...');
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (data.success) {
        setForgotStep(2);
        setForgotMessage(`Verification code sent to ${forgotEmail}. Check your inbox.`);
      } else {
        setForgotMessage(data.error || 'Unable to send reset OTP.');
      }
    } catch (error) {
      setForgotMessage('Unable to send reset email. Make sure the server is running.');
    }
  };

  const handleResetPassword = async () => {
    if (!forgotOtp) {
      setForgotMessage('Please enter the OTP.');
      return;
    }

    try {
      // Verify OTP with server
      const verifyRes = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, purpose: 'forgot_password', otp: forgotOtp }),
      });
      const verifyData = await verifyRes.json();
      
      if (!verifyData.success) {
        setForgotMessage(verifyData.error || 'Invalid or expired OTP.');
        return;
      }

      // If OTP is valid, reset password in database
      const result = await resetPasswordByEmail(forgotEmail, newPassword);
      if (result.success) {
        setForgotMessage('Password reset successfully!');
        setTimeout(() => {
          setForgotMode(false);
          setForgotStep(1);
        }, 2000);
      } else {
        setForgotMessage(result.error);
      }
    } catch (error) {
      setForgotMessage('Error verifying OTP.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Dark Blue Header Area */}
      <div style={{ 
        backgroundColor: '#051937', 
        padding: '60px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        borderBottomLeftRadius: '30px',
        borderBottomRightRadius: '30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ backgroundColor: '#10B981', padding: '10px', borderRadius: '12px' }}>
            <MapPin size={32} color="white" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '0.02em', lineHeight: '1' }}>NESTHR</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981', lineHeight: '1', marginTop: '2px' }}>GeoTrack</div>
          </div>
        </div>
        <div style={{ position: 'absolute', right: '40px', top: '80px', opacity: 0.2 }}>
           <MapPin size={40} />
        </div>
      </div>

      <div style={{ flex: 1, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-30px' }}>
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Welcome Back!</h2>
            <p style={{ fontSize: '15px', color: '#64748B', marginTop: '8px' }}>Sign in to continue</p>
          </div>

          {/* Role Selector */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
            <button 
              onClick={() => setRole('Employee')}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: '600', backgroundColor: role === 'Employee' ? 'white' : 'transparent', color: role === 'Employee' ? '#1E293B' : '#64748B', cursor: 'pointer', boxShadow: role === 'Employee' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
              Employee
            </button>
            <button 
              onClick={() => setRole('Company')}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: '600', backgroundColor: role === 'Company' ? 'white' : 'transparent', color: role === 'Company' ? '#1E293B' : '#64748B', cursor: 'pointer', boxShadow: role === 'Company' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
              Company
            </button>
          </div>

          {errorMsg && (
            <div style={{ padding: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '10px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          {forgotMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>
                Reset password for your account.
              </div>
              {forgotMessage && <div style={{ fontSize: '13px', color: '#10B981', fontWeight: '600' }}>{forgotMessage}</div>}
              
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '8px', display: 'block' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '15px' }}
                  />
                </div>
              </div>

              {forgotStep === 2 && (
                <>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '8px', display: 'block' }}>OTP Code</label>
                    <input 
                      type="text" 
                      placeholder="123456" 
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '15px' }}
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '8px', display: 'block' }}>New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '15px' }}
                    />
                  </div>
                </>
              )}

              <button 
                onClick={forgotStep === 1 ? sendForgotOtp : handleResetPassword}
                className="btn-primary" 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px' }}
              >
                {forgotStep === 1 ? 'Send OTP' : 'Reset Password'}
              </button>

              <button 
                onClick={() => setForgotMode(false)}
                style={{ width: '100%', background: 'none', border: 'none', color: '#64748B', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '8px', display: 'block' }}>{role} ID</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={20} style={{ position: 'absolute', left: '16px', color: '#94A3B8' }} />
                  <input 
                    type="text" 
                    placeholder={role === 'Employee' ? 'NES212345' : 'COMP212345'}
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '16px', backgroundColor: '#F8FAFC' }}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '8px', display: 'block' }}>Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '14px 48px 14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '16px', backgroundColor: '#F8FAFC', letterSpacing: showPassword ? 'normal' : '4px' }}
                  />
                  <div 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '16px', cursor: 'pointer', color: '#94A3B8' }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#1E293B', fontWeight: '500' }}>
                  <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }} />
                  Remember Me
                </label>
                <button 
                  type="button"
                  onClick={() => setForgotMode(true)}
                  style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  backgroundColor: '#10B981', 
                  color: 'white', 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  border: 'none', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                  transition: 'transform 0.2s'
                }}
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>
          )}

          {!forgotMode && (
            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748B' }}>
              New company? <span onClick={() => navigate('/register-company')} style={{ color: '#10B981', fontWeight: '700', cursor: 'pointer' }}>Register now</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
