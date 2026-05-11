import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, List, Map } from 'lucide-react';
import { getEmployeeAllocations } from '../supabaseHelpers';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../index.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MyAllocation = () => {
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
  const company_id = employeeData.company_id;
  const employee_id = employeeData.employee_id;

  useEffect(() => {
    const fetchAllocations = async () => {
      if (!company_id || !employee_id) {
        setAllocations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await getEmployeeAllocations(company_id, employee_id);
      setAllocations(data || []);
      setLoading(false);
    };

    fetchAllocations();
  }, [company_id, employee_id]);

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    try {
      const [h, m] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(h), parseInt(m));
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-bg)' }}>
      {/* Header */}
      <div className="shift-for-menu" style={{ backgroundColor: 'var(--card-white)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ChevronLeft 
            size={24} 
            className="back-button"
            style={{ cursor: 'pointer', color: 'var(--text-primary)' }} 
            onClick={() => navigate('/employee/dashboard')}
          />
          <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>My Allocation</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              backgroundColor: viewMode === 'list' ? 'var(--green)' : 'transparent',
              color: viewMode === 'list' ? 'white' : 'var(--text-primary)',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('map')}
            style={{
              backgroundColor: viewMode === 'map' ? 'var(--green)' : 'transparent',
              color: viewMode === 'map' ? 'white' : 'var(--text-primary)',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Map size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="app-content">
        {loading ? (
          <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading your allocations...</div>
        ) : allocations.length === 0 ? (
          <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>No active allocations found for your account.</div>
        ) : viewMode === 'map' ? (
          <div style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
            <MapContainer 
              center={[allocations[0]?.customer?.latitude || 0, allocations[0]?.customer?.longitude || 0]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {allocations.map((allocation) => (
                allocation.customer?.latitude && allocation.customer?.longitude && (
                  <React.Fragment key={allocation.allocation_id}>
                    <Marker position={[allocation.customer.latitude, allocation.customer.longitude]}>
                      <Popup>
                        <div>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{allocation.customer.customer_name}</h3>
                          <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Project:</strong> {allocation.project?.project_name}</p>
                          <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Code:</strong> {allocation.project?.project_code}</p>
                          <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Period:</strong> {allocation.from_date} - {allocation.to_date || 'Ongoing'}</p>
                          <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Shift:</strong> {formatTime(allocation.start_time || allocation.project?.start_time)} - {formatTime(allocation.end_time || allocation.project?.end_time)}</p>
                          <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Radius:</strong> {allocation.customer.radius_meters || 100}m</p>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle 
                      center={[allocation.customer.latitude, allocation.customer.longitude]} 
                      radius={allocation.customer.radius_meters || 100}
                      pathOptions={{ color: 'var(--green)', fillColor: 'var(--green)', fillOpacity: 0.1 }}
                    />
                  </React.Fragment>
                )
              ))}
            </MapContainer>
          </div>
        ) : (
          allocations.map((allocation) => (
            <div key={allocation.allocation_id} className="card" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', margin: 0 }}>{allocation.customer?.customer_name || 'Customer'}</h2>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{allocation.project?.project_name || 'Project'}</div>
                </div>
                <span style={{ 
                  backgroundColor: 'var(--green)', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '11px', 
                  fontWeight: 'var(--font-medium)' 
                }}>
                  Active
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Project Code</div>
                  <div style={{ fontSize: '14px', fontWeight: 'var(--font-medium)' }}>{allocation.project?.project_code || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Time Range</div>
                  <div style={{ fontSize: '14px', fontWeight: 'var(--font-medium)' }}>{allocation.from_date} - {allocation.to_date || 'Ongoing'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Shift Timing</div>
                  <div style={{ fontSize: '14px', fontWeight: 'var(--font-medium)', color: 'var(--blue)' }}>
                    {formatTime(allocation.start_time || allocation.project?.start_time)} - {formatTime(allocation.end_time || allocation.project?.end_time)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Location</div>
                  <div style={{ fontSize: '14px', fontWeight: 'var(--font-medium)' }}>{allocation.customer?.latitude && allocation.customer?.longitude ? `${allocation.customer.latitude}, ${allocation.customer.longitude}` : 'Location not available'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Radius</div>
                  <div style={{ fontSize: '14px', fontWeight: 'var(--font-medium)' }}>{allocation.customer?.radius_meters ? `${allocation.customer.radius_meters} Meters` : 'Default 100 Meters'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Remarks</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{allocation.remarks || 'No remarks available.'}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button 
                    onClick={() => {
                      setViewMode('map');
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px', 
                      backgroundColor: 'transparent',
                      border: '1px solid #E2E8F0',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 'var(--font-medium)',
                      cursor: 'pointer',
                    }}>
                    <MapPin size={16} color="var(--green)" /> View on Map
                  </button>
                  <button 
                    onClick={() => {
                      if (allocation.customer?.latitude && allocation.customer?.longitude) {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${allocation.customer.latitude},${allocation.customer.longitude}`, '_blank');
                      } else {
                        alert('Location coordinates not available');
                      }
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px', 
                      backgroundColor: 'var(--green)',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: 'var(--font-medium)',
                      cursor: 'pointer',
                    }}>
                    <Map size={16} /> Start (Maps)
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyAllocation;
