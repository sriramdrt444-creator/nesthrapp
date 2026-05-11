import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import { getEmployeeCurrentAllocation, getEmployeeAttendance, checkOutEmployee } from '../supabaseHelpers';
import '../index.css';

const CheckOut = () => {
  const navigate = useNavigate();
  const [allocation, setAllocation] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [currentCoords, setCurrentCoords] = useState({ latitude: null, longitude: null });
  const [distance, setDistance] = useState('-');
  const [locationStatus, setLocationStatus] = useState('Locating...');
  const [selfieData, setSelfieData] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
  const company_id = employeeData.company_id;
  const employee_id = employeeData.employee_id;

  useEffect(() => {
    const fetchData = async () => {
      if (!company_id || !employee_id) return;
      const today = new Date().toISOString().split('T')[0];
      setAllocation(await getEmployeeCurrentAllocation(company_id, employee_id, today));
      const records = await getEmployeeAttendance(company_id, employee_id, today, today);
      setTodayRecord(records?.[0] || null);
    };

    fetchData();
  }, [company_id, employee_id]);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera not supported');
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
      } catch (error) {
        console.error('Camera error:', error);
        setCameraError('Unable to access camera');
      }
    };

    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setCurrentCoords({ latitude: lat, longitude: lon });

        const targetLat = allocation?.customer?.latitude || 13.0827;
        const targetLon = allocation?.customer?.longitude || 80.2707;
        const R = 6371e3;
        const p1 = lat * Math.PI/180;
        const p2 = targetLat * Math.PI/180;
        const dp = (targetLat - lat) * Math.PI/180;
        const dl = (targetLon - lon) * Math.PI/180;
        const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = Math.floor(R * c);
        setDistance(`${d} Meters`);
        setLocationStatus(d <= (allocation?.customer?.radius_meters || 100) ? 'Matched' : 'Invalid Location');
      },
      (error) => setLocationStatus('GPS Error'),
      { enableHighAccuracy: true }
    );

    return () => {
      if (watchId && navigator.geolocation.clearWatch) navigator.geolocation.clearWatch(watchId);
    };
  }, [allocation]);

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelfieData(dataUrl);
  };

  const handleCheckOut = async () => {
    if (!company_id || !employee_id || !todayRecord) {
      alert('Unable to complete checkout. Please check in first.');
      return;
    }

    if (locationStatus !== 'Matched') {
      alert('Invalid location! You must be within the designated area to check out.');
      return;
    }

    if (!selfieData) {
      alert('Please capture a selfie before checking out.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const outTime = new Date().toISOString();
    const inTime = new Date(todayRecord.in_time);
    const diffHours = (new Date(outTime) - inTime) / 3600000;

    const result = await checkOutEmployee(company_id, employee_id, today, {
      out_time: outTime,
      out_latitude: currentCoords.latitude,
      out_longitude: currentCoords.longitude,
      out_distance: distance.includes('M') ? Number(distance.replace(' Meters', '')) : null,
      out_selfie: selfieData,
      total_worked_hours: Number(diffHours.toFixed(2)),
      overtime_hours: Math.max(0, Number((diffHours - 8).toFixed(2))),
      attendance_status: 'Present',
    });

    if (result.success) {
      const summary = {
        attendance_type: 'checkout',
        customer_name: allocation?.customer?.customer_name || 'Unknown Customer',
        project_name: allocation?.project?.project_name || 'Unknown Project',
        in_time: todayRecord.in_time,
        out_time: outTime,
        in_distance: todayRecord.in_distance,
        out_distance: distance.includes('M') ? Number(distance.replace(' Meters', '')) : null,
        gps_match_status: locationStatus,
        location_status: locationStatus,
        in_selfie: todayRecord?.in_selfie || null,
        out_selfie: selfieData,
      };
      window.localStorage.setItem('latestAttendanceResult', JSON.stringify(summary));
      navigate('/result', { state: { attendanceResult: summary } });
    } else {
      alert('Checkout failed: ' + result.error);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--dark-navy)' }}>
      {/* Header */}
      <div className="shift-for-menu" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ChevronLeft 
            size={24} 
            className="back-button"
            style={{ cursor: 'pointer' }} 
            onClick={() => navigate('/employee/dashboard')}
          />
          <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Check-Out</h1>
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Attendance Rule</span>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'var(--light-bg)', 
        borderTopLeftRadius: '24px', 
        borderTopRightRadius: '24px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        
        {/* Location Banner */}
        <div style={{ 
          backgroundColor: 'var(--card-white)', 
          borderRadius: '16px', 
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--green)' }}>
            <MapPin size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{allocation?.customer?.customer_name || 'No assignment'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{allocation?.project?.project_name || 'No project assigned'}</div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: '12px' }}>Today's Work</h2>
          
          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Check-In Time</div>
                  <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)' }}>{todayRecord?.in_time ? new Date(todayRecord.in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</div>
                </div>
                <div style={{ 
                  backgroundColor: todayRecord?.in_time ? 'rgba(16, 185, 129, 0.1)' : 'rgba(229, 62, 62, 0.1)', 
                  color: todayRecord?.in_time ? 'var(--green)' : 'var(--danger)', 
                  padding: '4px 12px', 
                  borderRadius: '16px', 
                  fontSize: '12px', 
                  fontWeight: 'var(--font-medium)' 
                }}>
                  {todayRecord?.in_time ? 'Checked In' : 'Not Checked In'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Check-Out Time</div>
                  <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)' }}>{todayRecord?.out_time ? new Date(todayRecord.out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</div>
                </div>
                <div style={{ width: '80px', height: '12px', backgroundColor: '#E2E8F0', borderRadius: '4px' }}></div>
              </div>

              <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '4px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Hours</div>
                  <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)' }}>{todayRecord?.total_worked_hours ? `${todayRecord.total_worked_hours.toFixed(2)} Hours` : '-'}</div>
                </div>
                <div style={{ width: '80px', height: '12px', backgroundColor: '#E2E8F0', borderRadius: '4px' }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Location</div>
                  <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', color: locationStatus === 'Matched' ? 'var(--green)' : 'var(--warning)' }}>{locationStatus}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'var(--semibold)', color: 'var(--text-primary)' }}>{distance}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: '12px' }}>Selfie Verification</h2>
          <div style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid #E2E8F0', backgroundColor: 'white', minHeight: '260px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {selfieData ? (
              <img src={selfieData} alt="Captured Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                {!cameraActive && !cameraError && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', color: 'white' }}>
                    Initializing camera...
                  </div>
                )}
                {cameraError && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center', color: '#D14343' }}>
                    {cameraError}
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            {!selfieData ? (
              <button className="btn-primary" onClick={captureSelfie} disabled={!cameraActive || !!cameraError || !todayRecord?.in_time}>
                Capture Selfie
              </button>
            ) : (
              <button className="btn-secondary" onClick={() => setSelfieData(null)}>
                Retake Selfie
              </button>
            )}
            {selfieData && (
              <button className="btn-primary" style={{ minWidth: '180px' }} onClick={handleCheckOut}>
                Check-Out Now
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckOut;
