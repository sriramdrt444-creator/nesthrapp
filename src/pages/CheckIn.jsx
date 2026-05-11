import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Zap } from 'lucide-react';
import { getEmployeeCurrentAllocation, checkInEmployee } from '../supabaseHelpers';
import '../index.css';

const CheckIn = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationStatus, setLocationStatus] = useState('Locating...');
  const [distance, setDistance] = useState('-');
  const [isMatch, setIsMatch] = useState(false);
  const [allocation, setAllocation] = useState(null);
  const [currentCoords, setCurrentCoords] = useState({ latitude: null, longitude: null });
  const [loading, setLoading] = useState(true);
  const [selfieData, setSelfieData] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
  const company_id = employeeData.company_id;
  const employee_id = employeeData.employee_id;

  const targetLat = allocation?.customer?.latitude || 13.0827;
  const targetLon = allocation?.customer?.longitude || 80.2707;
  const targetRadius = allocation?.customer?.radius_meters || 100;

  useEffect(() => {
    const fetchAllocation = async () => {
      if (!company_id || !employee_id) {
        setAllocation(null);
        setLoading(false);
        return;
      }

      const today = new Date().toLocaleDateString('en-CA');
      const allocationData = await getEmployeeCurrentAllocation(company_id, employee_id, today);
      setAllocation(allocationData);
      setLoading(false);
    };

    fetchAllocation();
  }, [company_id, employee_id]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setCurrentCoords({ latitude: lat, longitude: lon });
          
          const R = 6371e3; // metres
          const p1 = lat * Math.PI/180;
          const p2 = targetLat * Math.PI/180;
          const dp = (targetLat - lat) * Math.PI/180;
          const dl = (targetLon - lon) * Math.PI/180;

          const a = Math.sin(dp/2) * Math.sin(dp/2) +
                    Math.cos(p1) * Math.cos(p2) *
                    Math.sin(dl/2) * Math.sin(dl/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const d = Math.floor(R * c);

          setDistance(`${d} Meters`);
          if (d <= targetRadius) {
            setLocationStatus('Matched');
            setIsMatch(true);
          } else {
            setLocationStatus('Invalid Location');
            setIsMatch(false);
          }
        },
        (error) => {
          setLocationStatus('GPS Error');
        },
        { enableHighAccuracy: true }
      );
    }

    return () => {
      clearInterval(timer);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [targetLat, targetLon, targetRadius]);

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

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelfieData(dataUrl);
    setCheckInMessage('');
  };

  const handleCheckIn = async () => {
    if (!selfieData) {
      setCheckInMessage('Please capture a clear selfie before checking in.');
      return;
    }

    if (!isMatch) {
      setCheckInMessage('Invalid location! You must be within the designated area to check in.');
      return;
    }

    setCheckInMessage('');

    const today = new Date().toLocaleDateString('en-CA');
    const inTime = new Date().toISOString();

    if (!company_id || !employee_id) {
      alert('Please login again to check in.');
      navigate('/login');
      return;
    }

    const result = await checkInEmployee(company_id, {
      employee_id,
      customer_id: allocation?.customer_id,
      project_id: allocation?.project_id,
      attendance_date: today,
      in_time: inTime,
      in_latitude: currentCoords.latitude,
      in_longitude: currentCoords.longitude,
      in_distance: distance.includes('M') ? Number(distance.replace(' Meters', '')) : null,
      in_selfie: selfieData,
      gps_match_status: isMatch ? 'Matched' : 'Invalid Location',
    });

    if (result.success) {
      const summary = {
        attendance_type: 'checkin',
        customer_name: allocation?.customer?.customer_name || 'Unknown Customer',
        project_name: allocation?.project?.project_name || 'Unknown Project',
        in_time: inTime,
        in_selfie: selfieData,
        attendance_date: today,
        gps_match_status: isMatch ? 'Matched' : 'Invalid Location',
        in_distance: distance.includes('M') ? Number(distance.replace(' Meters', '')) : null,
        location_status: locationStatus,
      };
      window.localStorage.setItem('latestAttendanceResult', JSON.stringify(summary));
      navigate('/result', { state: { attendanceResult: summary } });
    } else {
      alert('Failed to save check-in: ' + result.error);
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
          <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Check-In</h1>
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
        flexDirection: 'column'
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
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
            {!selfieData ? (
              <button className="btn-primary" onClick={captureSelfie} disabled={!cameraActive || !!cameraError}>
                Capture Selfie
              </button>
            ) : (
              <button className="btn-secondary" onClick={() => setSelfieData(null)}>
                Retake Selfie
              </button>
            )}
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Please capture a clear selfie before checking in. Make sure your face is centered and remove or adjust any hat if needed.
          </div>
        </div>

        {checkInMessage && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.18)',
              color: 'var(--danger)',
              fontSize: '13px',
              fontWeight: 'var(--font-medium)'
            }}
          >
            {checkInMessage}
          </div>
        )}

        {/* Check-In Button */}
        <button className="btn-primary" onClick={handleCheckIn} disabled={!allocation || !currentCoords.latitude}>
          {allocation ? 'Check-In Now' : 'No active assignment'}
        </button>

        {/* Time and Location Footnote */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          <span>{formatTime(currentTime)}</span>
          <MapPin size={12} />
        </div>

      </div>
    </div>
  );
};

export default CheckIn;
