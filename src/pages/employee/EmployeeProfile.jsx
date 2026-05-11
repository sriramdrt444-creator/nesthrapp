import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  Wallet,
  Users,
} from 'lucide-react';

export default function EmployeeProfile() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadEmployeeProfile();
  }, []);

  const loadEmployeeProfile = async () => {
    try {
      const employeeData = JSON.parse(localStorage.getItem('employeeData'));
      if (!employeeData) {
        navigate('/login');
        return;
      }

      setEmployee(employeeData);
      setFormData(employeeData);
    } catch (error) {
      console.error('Error loading employee profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      localStorage.setItem('employeeData', JSON.stringify(formData));
      setEmployee(formData);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFormData(employee || {});
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <section className="profile-card">
          <div className="profile-card-top shift-for-menu">
            <div className="profile-header-left">
              <button
                onClick={() => navigate('/employee/dashboard')}
                className="profile-back-btn"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>

              <div className="profile-main">
                <div className="profile-info-grid">
                  <div className="profile-avatar">
                    {getInitials(employee?.name || employee?.employee_name)}
                  </div>
                  <div>
                    <p className="profile-label">My Profile</p>
                    <h1 className="profile-name">
                      {employee?.name || employee?.employee_name || 'Employee'}
                    </h1>
                    <p className="profile-title">
                      {employee?.employee_id || 'No employee ID'} | {employee?.designation || 'No designation'}
                    </p>
                    <div className="profile-meta">
                      <span className="profile-badge">Department: {employee?.department || 'N/A'}</span>
                      <span className="profile-badge">Joined: {formatDate(employee?.date_of_joining)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                className="btn-action btn-action-primary"
              >
                {isEditing ? <Save size={16} /> : <Edit2 size={16} />}
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
              {isEditing ? (
                <button
                  onClick={cancelEditing}
                  className="btn-action btn-action-secondary"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="profile-sections">
          <div className="section-stack">
            <SectionCard
              icon={User}
              title="Personal Information"
              subtitle="Main employee details and contact information."
            >
              <div className="section-grid">
                <FieldBlock
                  label="Email Address"
                  icon={Mail}
                  editing={isEditing}
                  input={
                    <TextInput
                      type="email"
                      value={formData.email || ''}
                      onChange={(value) => handleInputChange('email', value)}
                      placeholder="Enter email address"
                    />
                  }
                  value={employee?.email || 'Not provided'}
                />
                <FieldBlock
                  label="Phone Number"
                  icon={Phone}
                  editing={isEditing}
                  input={
                    <TextInput
                      type="tel"
                      value={formData.phone_number || ''}
                      onChange={(value) => handleInputChange('phone_number', value)}
                      placeholder="Enter phone number"
                    />
                  }
                  value={employee?.phone_number || 'Not provided'}
                />
                <StaticField label="Designation" value={employee?.designation || 'Not provided'} />
                <StaticField label="Department" value={employee?.department || 'Not provided'} />
                <StaticField label="Date of Joining" value={formatDate(employee?.date_of_joining)} />
                <FieldBlock
                  label="Gender"
                  editing={isEditing}
                  input={
                    <SelectInput
                      value={formData.gender || ''}
                      onChange={(value) => handleInputChange('gender', value)}
                      options={['Male', 'Female', 'Other']}
                    />
                  }
                  value={employee?.gender || 'Not provided'}
                />
              </div>
            </SectionCard>

            <SectionCard
              icon={MapPin}
              title="Address Information"
              subtitle="Current and permanent addresses."
            >
              <div className="section-grid">
                <FieldBlock
                  label="Current Address"
                  editing={isEditing}
                  input={
                    <TextAreaInput
                      value={formData.current_address || ''}
                      onChange={(value) => handleInputChange('current_address', value)}
                      placeholder="Enter current address"
                    />
                  }
                  value={employee?.current_address || 'Not provided'}
                />
                <FieldBlock
                  label="Permanent Address"
                  editing={isEditing}
                  input={
                    <TextAreaInput
                      value={formData.permanent_address || ''}
                      onChange={(value) => handleInputChange('permanent_address', value)}
                      placeholder="Enter permanent address"
                    />
                  }
                  value={employee?.permanent_address || 'Not provided'}
                />
              </div>
            </SectionCard>

            <SectionCard
              icon={Users}
              title="Emergency Contact"
              subtitle="Who should be contacted in an emergency."
            >
              <div className="section-grid">
                <FieldBlock
                  label="Contact Name"
                  editing={isEditing}
                  input={
                    <TextInput
                      value={formData.emergency_contact_name || ''}
                      onChange={(value) => handleInputChange('emergency_contact_name', value)}
                      placeholder="Enter contact name"
                    />
                  }
                  value={employee?.emergency_contact_name || 'Not provided'}
                />
                <FieldBlock
                  label="Contact Number"
                  editing={isEditing}
                  input={
                    <TextInput
                      type="tel"
                      value={formData.emergency_contact_number || ''}
                      onChange={(value) => handleInputChange('emergency_contact_number', value)}
                      placeholder="Enter contact number"
                    />
                  }
                  value={employee?.emergency_contact_number || 'Not provided'}
                />
              </div>
            </SectionCard>
          </div>

          <div className="section-stack">
            <SectionCard
              icon={Wallet}
              title="Bank Details"
              subtitle="Salary payment and banking information."
            >
              <div className="section-grid-single">
                <FieldBlock
                  label="Account Number"
                  editing={isEditing}
                  input={
                    <TextInput
                      value={formData.bank_account_number || ''}
                      onChange={(value) => handleInputChange('bank_account_number', value)}
                      placeholder="Enter account number"
                    />
                  }
                  value={employee?.bank_account_number || 'Not provided'}
                />
                <FieldBlock
                  label="Bank Name"
                  editing={isEditing}
                  input={
                    <TextInput
                      value={formData.bank_name || ''}
                      onChange={(value) => handleInputChange('bank_name', value)}
                      placeholder="Enter bank name"
                    />
                  }
                  value={employee?.bank_name || 'Not provided'}
                />
                <FieldBlock
                  label="IFSC Code"
                  editing={isEditing}
                  input={
                    <TextInput
                      value={formData.ifsc_code || ''}
                      onChange={(value) => handleInputChange('ifsc_code', value)}
                      placeholder="Enter IFSC code"
                    />
                  }
                  value={employee?.ifsc_code || 'Not provided'}
                />
                <FieldBlock
                  label="UPI ID"
                  editing={isEditing}
                  input={
                    <TextInput
                      value={formData.upi_id || ''}
                      onChange={(value) => handleInputChange('upi_id', value)}
                      placeholder="Enter UPI ID"
                    />
                  }
                  value={employee?.upi_id || 'Not provided'}
                />
              </div>
            </SectionCard>

            <SectionCard
              icon={ShieldCheck}
              title="Government Identification"
              subtitle="Identity and payroll-related numbers."
            >
              <div className="section-grid-single">
                <FieldBlock
                  label="Aadhar Number"
                  editing={isEditing}
                  input={
                    <TextInput
                      value={formData.aadhar_number || ''}
                      onChange={(value) => handleInputChange('aadhar_number', value)}
                      placeholder="Enter Aadhar number"
                    />
                  }
                  value={employee?.aadhar_number || 'Not provided'}
                />
                <FieldBlock
                  label="PAN Number"
                  editing={isEditing}
                  input={
                    <TextInput
                      value={formData.pan_number || ''}
                      onChange={(value) => handleInputChange('pan_number', value)}
                      placeholder="Enter PAN number"
                    />
                  }
                  value={employee?.pan_number || 'Not provided'}
                />
                <StaticField label="PF Number (UAN)" value={employee?.pf_number || 'Not provided'} />
                <StaticField label="ESI Number" value={employee?.esi_number || 'Not provided'} />
              </div>
            </SectionCard>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="section-card">
      <div className="section-title">
        <div className="section-icon">
          <Icon size={20} />
        </div>
        <div>
          <h2>{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldBlock({ label, value, editing, input, icon: Icon }) {
  return (
    <div className="field-block">
      <label className="field-label">
        {Icon ? <Icon size={14} /> : null}
        {label}
      </label>
      {editing ? input : <p className="field-value">{value}</p>}
    </div>
  );
}

function StaticField({ label, value }) {
  return (
    <div className="field-block">
      <label className="field-label">{label}</label>
      <p className="field-value">{value}</p>
    </div>
  );
}

function TextInput({ type = 'text', value, onChange, placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-field"
    />
  );
}

function TextAreaInput({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="input-field textarea-field"
    />
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field select-field"
    >
      <option value="">Select option</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function Badge({ label, value }) {
  return (
    <span className="profile-badge">{label}: {value}</span>
  );
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'EM';
}

function formatDate(dateValue) {
  if (!dateValue) return 'Not available';
  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
