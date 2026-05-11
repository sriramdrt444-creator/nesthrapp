import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Building, Crosshair, Upload, AlertCircle } from 'lucide-react';
import { createCompanyCustomer } from '../../supabaseHelpers';
import '../../index.css';

const CreateCustomer = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('100');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [industryType, setIndustryType] = useState('');
  const [customerLogo, setCustomerLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [status, setStatus] = useState('Active');
  const [customerBranch, setCustomerBranch] = useState('');
  const [error, setError] = useState('');

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomerLogo(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    setError('');
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(8));
          setLongitude(position.coords.longitude.toFixed(8));
          setGettingLocation(false);
        },
        (error) => {
          setError('Error getting location: ' + error.message);
          setGettingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setGettingLocation(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (!adminData || !adminData.company_id) {
      setError('Admin session not found. Please login again.');
      navigate('/login');
      return;
    }

    // Validation
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }

    if (!address.trim()) {
      setError('Address is required.');
      return;
    }

    // Validate phone number
    if (contactPhone && !/^[6-9]\d{9}$/.test(contactPhone)) {
      setError('Contact phone must be a valid 10-digit mobile number (starting with 6-9).');
      return;
    }

    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const rad = parseInt(radius);

      if (isNaN(lat) || isNaN(lng)) {
        setError('Please get valid GPS coordinates before saving.');
        return;
      }

      const customerData = {
        customer_name: customerName,
        address: address,
        latitude: lat,
        longitude: lng,
        radius_meters: isNaN(rad) ? 100 : rad,
        customer_contact_person: contactPerson,
        customer_contact_email: contactEmail,
        customer_contact_phone: contactPhone,
        gst_number: gstNumber,
        industry_type: industryType,
        customer_logo: logoPreview,
        status: status,
        customer_branch: customerBranch,
      };

      const result = await createCompanyCustomer(adminData.company_id, customerData);
      if (result.success) {
        alert('Customer created successfully!');
        navigate('/admin/customer');
      } else {
        setError('Failed to create customer: ' + result.error);
      }
    } catch (error) {
      setError('Error creating customer: ' + error.message);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-bg)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--card-white)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid #E2E8F0' }}>
        <ChevronLeft 
          size={24} 
          style={{ position: 'absolute', left: '20px', cursor: 'pointer', color: 'var(--text-primary)' }} 
          onClick={() => navigate('/admin/customer')}
        />
        <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Create Customer</h1>
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
          
          {/* Customer Details Section */}
          <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Customer Details</h3>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Customer Name *</label>
              <div className="input-wrapper">
                <Building size={18} className="input-icon" />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. ABC Traders Pvt Ltd" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Customer Logo</label>
              <div style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
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
                      <img src={logoPreview} alt="Logo Preview" style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '4px' }} />
                      <span style={{ fontSize: '12px', color: '#64748B' }}>Click to change</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>Click to upload logo</span>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>PNG, JPG up to 10MB</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">GST Number</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. 27AABCU9603R1Z0" 
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Industry Type</label>
              <select 
                className="input-field" 
                style={{ paddingLeft: '16px' }}
                value={industryType}
                onChange={(e) => setIndustryType(e.target.value)}
              >
                <option value="">Select Industry</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="IT">Information Technology</option>
                <option value="Retail">Retail</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Logistics">Logistics</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Customer Branch</label>
              <select 
                className="input-field" 
                style={{ paddingLeft: '16px' }}
                value={customerBranch}
                onChange={(e) => setCustomerBranch(e.target.value)}
              >
                <option value="">Select Branch</option>
                <option value="Branch 1">Branch 1</option>
                <option value="Branch 2">Branch 2</option>
                <option value="Branch 3">Branch 3</option>
                <option value="Branch 4">Branch 4</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Status</label>
              <select 
                className="input-field" 
                style={{ paddingLeft: '16px' }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Contact Details Section */}
          <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Contact Information</h3>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Contact Person Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. John Smith" 
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Contact Email</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="contact@company.com" 
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Contact Phone</label>
              <input 
                type="tel" 
                className="input-field" 
                placeholder="10-digit mobile number"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                pattern="[6-9][0-9]{9}"
                maxLength={10}
              />
            </div>
          </div>

          {/* Address Section */}
          <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', marginBottom: '16px', color: 'var(--text-primary)' }}>Location Details</h3>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Address *</label>
              <div className="input-wrapper textarea-wrapper">
                <MapPin size={18} className="input-icon" />
                <textarea 
                  className="input-field" 
                  placeholder="Complete address" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="3"
                  required
                  style={{ paddingRight: '16px', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Location Capture Section */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'var(--font-semibold)' }}>GPS Location *</div>
                <button 
                  type="button" 
                  onClick={handleGetLocation}
                  disabled={gettingLocation}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', 
                    backgroundColor: 'var(--dark-navy)', color: 'white', 
                    border: 'none', padding: '8px 12px', borderRadius: '8px', 
                    fontSize: '12px', cursor: 'pointer', opacity: gettingLocation ? 0.6 : 1 
                  }}
                >
                  <Crosshair size={14} />
                  {gettingLocation ? 'Fetching...' : 'Get Location'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Latitude</label>
                  <input 
                    type="text" 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', fontFamily: 'Poppins' }} 
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="0.000000"
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Longitude</label>
                  <input 
                    type="text" 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', fontFamily: 'Poppins' }} 
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="0.000000"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Allowed Check-In Radius (Meters)</label>
              <input 
                type="number" 
                className="input-field" 
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
            Save Customer
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCustomer;
