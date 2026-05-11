import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock3,
  History,
  LayoutGrid,
  MapPin,
  Route,
  TrendingUp,
  User,
  UserCheck,
  LogOut,
  Laptop,
  Activity,
  MonitorOff,
  Palmtree,
} from 'lucide-react';
import { 
  getEmployeeCurrentAllocation, 
  getEmployeeLeaves, 
  getEmployeeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getEmployeeById,
  getCompanyConfiguration
} from '../../supabaseHelpers';
import logo from '../logo.png';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [stats, setStats] = useState({
    leavesUsed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showCheckInAppreciation, setShowCheckInAppreciation] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState({});
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isOnTime, setIsOnTime] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const employeeData = JSON.parse(localStorage.getItem('employeeData'));
      if (!employeeData) {
        navigate('/login');
        return;
      }
      setEmployee(employeeData);

      // Get local date in YYYY-MM-DD format
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;      
      // Fetch concurrently for better performance
      const [allocationData, leavesResult, notifResult, attendanceResult, profileResult] = await Promise.all([
        getEmployeeCurrentAllocation(employeeData.company_id, employeeData.employee_id, today),
        getEmployeeLeaves(employeeData.company_id, employeeData.employee_id),
        getEmployeeNotifications(employeeData.company_id, employeeData.employee_id),
        fetchAttendanceStatus(employeeData.company_id, employeeData.employee_id, today),
        getEmployeeById(employeeData.company_id, employeeData.employee_id),
        getCompanyConfiguration(employeeData.company_id)
      ]);

      if (profileResult.success) {
        const updatedData = { ...employeeData, ...profileResult.employee, employee_name: profileResult.employee.name };
        setEmployee(updatedData);
        localStorage.setItem('employeeData', JSON.stringify(updatedData));
      }

      setAllocation(allocationData);

      if (leavesResult.leaves) {
        // Only count rows with used_days and from_date as actual "Used" leaves
        const used = leavesResult.leaves
          .filter(leave => leave.from_date && leave.approval_status === 'Approved')
          .reduce((sum, leave) => sum + (leave.used_days || 0), 0);
        setStats(prev => ({ ...prev, leavesUsed: used }));

        // Fetch Leave Balances
        const balances = {};
        leavesResult.leaves.forEach(leaf => {
          const type = leaf.leave_type;
          if (!balances[type]) balances[type] = 0;
          if (leaf.approval_status === 'Approved') {
            balances[type] += (leaf.allotted_days || 0) - (leaf.used_days || 0);
          }
        });
        setLeaveBalances(balances);
      }

      if (notifResult.success) {
        setNotifications(notifResult.notifications || []);
      }

      if (attendanceResult) {
        setTodayAttendance(attendanceResult);
        const checkedIn = attendanceResult.in_time && !attendanceResult.out_time;
        setIsCheckedIn(checkedIn);
        setShowCheckInAppreciation(checkedIn);
        
        // Check if employee checked in on time
        const configResult = await getCompanyConfiguration(employeeData.company_id);
        if (attendanceResult.in_time && configResult.success) {
          const punchInTime = configResult.config?.punch_in_time || '09:00';
          const [configH, configM] = punchInTime.split(':').map(Number);
          const inDate = new Date(attendanceResult.in_time);
          const inMinutes = inDate.getHours() * 60 + inDate.getMinutes();
          const limitMinutes = configH * 60 + configM + 15; // 15-min grace
          if (inMinutes <= limitMinutes) {
            setIsOnTime(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStatus = async (company_id, employee_id, date) => {
    const { data } = await supabase
      .from('attendance_checkin_checkout')
      .select('in_time, out_time')
      .eq('company_id', company_id)
      .eq('employee_id', employee_id)
      .eq('attendance_date', date)
      .maybeSingle();
    return data;
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-card">
          <div className="loading-spinner" />
          <p className="loading-text">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => `INR ${Number(val || 0).toLocaleString('en-IN')}`;

  const handleMarkRead = async (id) => {
    const res = await markNotificationAsRead(employee.company_id, employee.employee_id, id);
    if (res.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      // Close tray after clicking a notification
      setShowNotifs(false);
    }
  };

  const handleToggleNotifs = async () => {
    const nextState = !showNotifs;
    setShowNotifs(nextState);
    
    // If opening the tray, mark all as read to hide the badge
    if (nextState && unreadCount > 0) {
      const res = await markAllNotificationsAsRead(employee.company_id, employee.employee_id);
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const calculateDuration = () => {
    if (!todayAttendance || !todayAttendance.in_time) return '0h 0m';
    
    // Parse the in_time. Assuming format is 'HH:MM:SS' or similar from Supabase
    const [hours, minutes] = todayAttendance.in_time.split(':');
    const startTime = new Date();
    startTime.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const endTime = todayAttendance.out_time 
      ? (() => {
          const [oH, oM] = todayAttendance.out_time.split(':');
          const d = new Date();
          d.setHours(parseInt(oH), parseInt(oM), 0);
          return d;
        })()
      : new Date();
      
    const diffMs = endTime - startTime;
    if (diffMs < 0) return '0h 0m';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const calculateProgress = (from, to) => {
    try {
      const start = new Date(from);
      const end = to ? new Date(to) : new Date();
      const today = new Date();
      
      const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      const elapsedDays = Math.max(0, Math.ceil((today - start) / (1000 * 60 * 60 * 24)));
      
      const progress = to ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : 100;
      return { progress, elapsedDays, totalDays };
    } catch (e) {
      return { progress: 0, elapsedDays: 0, totalDays: 0 };
    }
  };

  const planStats = allocation ? calculateProgress(allocation.from_date, allocation.to_date) : null;

  return (
    <div className="employee-dashboard-page" style={{ 
      background: 'radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.05) 0%, transparent 50%), #F8FAFC', 
      minHeight: '100vh', 
      paddingBottom: '100px' 
    }}>
      
      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-2px) scale(1.1); }
          }
          @keyframes pulse-green {
            0% { box-shadow: 0 0 0px rgba(16, 185, 129, 0); }
            50% { box-shadow: 0 0 18px rgba(16, 185, 129, 0.45); }
            100% { box-shadow: 0 0 0px rgba(16, 185, 129, 0); }
          }
          @keyframes slide-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .action-card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .action-card-hover:hover {
            transform: translateY(-6px);
            box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15) !important;
            border-color: #10B981 !important;
          }
          .action-card-hover:active {
            transform: translateY(-2px) scale(0.98);
          }
          .grid-responsive-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          .grid-responsive-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .premium-gradient-header {
            background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
          }
          .lite-dar-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          @media (max-width: 500px) {
            .grid-responsive-3 {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 380px) {
            .grid-responsive-3 {
              grid-template-columns: 1fr;
            }
            .grid-responsive-2 {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
      
      {/* 1. Modern Header Area (Victus Style) */}
      <div className="dashboard-header-premium shift-for-menu employee-dashboard-header" style={{ 
        width: 'calc(100% - 24px)',
        margin: '12px auto 0',
        padding: '12px 16px', 
        minHeight: '82px',
        borderRadius: '20px',
        background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 15px 30px rgba(16, 185, 129, 0.25)',
        position: 'relative',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Logo Box - Solid background for clarity */}
          <div style={{ 
            background: '#ffffff', 
            padding: '8px', 
            borderRadius: '16px', 
            width: '56px', 
            height: '56px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            transition: 'transform 0.3s ease'
          }}>
            <img src={logo} alt="N" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          {/* Branding */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ 
              fontSize: '20px', 
              fontWeight: 900, 
              color: '#ffffff', 
              margin: 0, 
              letterSpacing: '0.05em', 
              textTransform: 'uppercase',
              lineHeight: 1.1
            }}>NESTHR COMPANY</h1>
            <p style={{ 
              fontSize: '11px', 
              color: 'rgba(255, 255, 255, 0.85)', 
              margin: '2px 0 0 0', 
              fontWeight: 600,
              letterSpacing: '0.02em'
            }}>Employee Dashboard • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Notifications */}
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleToggleNotifs}>
            <div style={{ 
              padding: '10px', 
              borderRadius: '12px', 
              background: 'rgba(255, 255, 255, 0.15)', 
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'white'
            }}>
              <Bell size={18} />
            </div>
            {unreadCount > 0 && (
              <div style={{ 
                position: 'absolute', top: -3, right: -3, 
                width: '10px', height: '10px', 
                background: '#ff4d4f', borderRadius: '50%', 
                border: '2px solid #10b981' 
              }} />
            )}
          </div>

          {/* Logout */}
          <button 
            onClick={() => {
              localStorage.removeItem('employeeData');
              navigate('/login');
            }}
            style={{ 
              padding: '10px', 
              borderRadius: '12px', 
              background: '#ffffff', 
              border: 'none', 
              color: '#10b981', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Notification Tray Overlay */}
        {showNotifs && (
          <div style={{
            position: 'absolute',
            top: '92px',
            right: '0',
            width: '320px',
            maxHeight: '400px',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            zIndex: 1000,
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Notifications</h3>
              <span style={{ fontSize: '11px', backgroundColor: '#EFF6FF', color: '#3B82F6', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                {unreadCount} New
              </span>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleMarkRead(notif.id)}
                    style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid #F1F5F9', 
                      cursor: 'pointer',
                      backgroundColor: notif.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{notif.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>{notif.message}</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '6px' }}>
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  No notifications yet
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div 
                style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #F1F5F9', fontSize: '12px', fontWeight: 600, color: '#3B82F6', cursor: 'pointer' }}
                onClick={() => setShowNotifs(false)}
              >
                Close
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. User Greeting - Premium Lite style */}
      <div className="dashboard-user-greeting" style={{ 
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #F1F5F9',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#10B981', fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{getGreeting()}</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginTop: '2px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {employee?.employee_name?.split(' ')[0] || 'User'} <span style={{ fontSize: '24px', animation: 'bounce 2s infinite' }}>👋</span>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ 
            padding: '3px', 
            background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
            borderRadius: '24px',
            boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)'
          }}>
            <img 
              src={employee?.photo_url || `https://ui-avatars.com/api/?name=${employee?.employee_name || 'User'}&background=random&size=100`} 
              alt="Profile" 
              className="user-avatar"
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '21px', 
                border: '2px solid white',
                objectFit: 'cover'
              }}
            />
          </div>
          <div style={{ 
            position: 'absolute', 
            bottom: '0px', 
            right: '0px', 
            width: '18px', 
            height: '18px', 
            backgroundColor: '#10B981', 
            border: '2px solid white', 
            borderRadius: '50%',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
          }} />
        </div>
      </div>

      {/* Top Quick Options - Rich Teal Aesthetic */}
      <div className="mobile-all-options mobile-all-options-top" style={{ padding: '0 16px', marginTop: '16px' }}>
        <div className="grid-responsive-3">
          {[
            {
              title: isCheckedIn ? 'Check Out' : 'Check In',
              desc: isCheckedIn ? 'End Shift' : 'Start Shift',
              icon: UserCheck,
              path: isCheckedIn ? '/checkout' : '/checkin',
              gradient: isCheckedIn ? 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              shadow: isCheckedIn ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'
            },
            { title: 'Timesheet', desc: 'Work Hours', icon: ClipboardList, path: '/timesheet', gradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)', shadow: 'rgba(16, 185, 129, 0.2)' },
            { title: 'Allocation', desc: 'Assigned', icon: LayoutGrid, path: '/allocation', gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', shadow: 'rgba(59, 130, 246, 0.2)' },
          ].map((item, idx) => (
            <button key={idx} className="card action-card-hover" style={{ 
              background: 'white', 
              padding: '20px 12px', 
              borderRadius: '24px', 
              border: '1px solid #F1F5F9', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: 'pointer', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.03)', 
              textAlign: 'center',
              width: '100%',
              position: 'relative',
              overflow: 'hidden'
            }} onClick={() => navigate(item.path)}>
              <div style={{ 
                width: '52px', 
                height: '52px', 
                borderRadius: '16px', 
                background: item.gradient, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                boxShadow: `0 8px 16px ${item.shadow}`,
                marginBottom: '4px',
                position: 'relative',
                zIndex: 1
              }}><item.icon size={24} /></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{item.title}</div>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Check-In Appreciation Banner */}
      {showCheckInAppreciation && (
        <div style={{ padding: '0 16px', marginTop: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.95) 100%)',
            borderRadius: '24px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 12px 24px rgba(37, 99, 235, 0.2)',
            animation: 'slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              position: 'absolute', right: '-20px', top: '-20px',
              width: '90px', height: '90px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }} />
            <div style={{
              width: '46px', height: '46px', borderRadius: '14px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', flexShrink: 0,
              boxShadow: 'inset 0 0 10px rgba(255,255,255,0.2)'
            }}>👋</div>
            <div style={{ flex: 1, zIndex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 900, color: 'white', letterSpacing: '-0.01em' }}>
                WELCOME BACK!
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: '2px' }}>
                You're checked in for a great day ahead!
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '10px', padding: '6px 12px',
              fontSize: '11px', fontWeight: 900, color: 'white',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>CHECKED IN</div>
          </div>
        </div>
      )}

      {/* On-Time Appreciation Banner */}
      {isOnTime && (
        <div style={{ padding: '0 16px', marginTop: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.95) 100%)',
            borderRadius: '24px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 12px 24px rgba(16, 185, 129, 0.2)',
            animation: 'slide-in 0.4s ease, pulse-green 3s infinite 0.5s',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              position: 'absolute', right: '-25px', top: '-25px',
              width: '1000px', height: '100px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }} />
            <div style={{
              width: '46px', height: '46px', borderRadius: '14px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', flexShrink: 0,
              boxShadow: 'inset 0 0 10px rgba(255,255,255,0.2)'
            }}>✨</div>
            <div style={{ flex: 1, zIndex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 900, color: 'white', letterSpacing: '-0.01em' }}>
                ON-TIME PERFORMANCE!
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: '2px' }}>
                Great job being punctual today. Keep it up! 🏆
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '10px', padding: '6px 12px',
              fontSize: '11px', fontWeight: 900, color: 'white',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>TOP PERFORMER</div>
          </div>
        </div>
      )}

      {/* 1. Today's Plan - Enriched Card */}
      <div className="dashboard-section" style={{ padding: '0 16px', marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Today's Schedule</h2>
          <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)', padding: '4px 10px', borderRadius: '8px' }}>Active Session</div>
        </div>
        <div className="plan-card" style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
          borderRadius: '30px', 
          padding: '28px 24px', 
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.3)',
          color: 'white'
        }}>
          {/* Decorative Circle */}
          <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />
          <div style={{ position: 'absolute', left: '-20px', bottom: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)', zIndex: 0 }} />

          <div className="plan-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
            <div className="plan-card-tag" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '12px', backdropFilter: 'blur(4px)' }}>
              <Calendar size={18} />
              <span>TODAY'S PLAN</span>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '10px' }}>
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>

          {allocation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '22px', fontWeight: '950', color: 'white', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                    {allocation.customer?.customer_name || 'N/A'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FCD34D', animation: 'pulse-green 2s infinite' }} />
                    <p style={{ fontSize: '13px', color: '#BFDBFE', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      {allocation.project?.project_name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div style={{ background: '#10B981', color: 'white', fontSize: '11px', fontWeight: '900', padding: '6px 16px', borderRadius: '12px', textTransform: 'uppercase', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)', letterSpacing: '0.05em' }}>Active</div>
              </div>

              <div className="grid-responsive-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.08em' }}>Code</p>
                  <p style={{ fontSize: '15px', fontWeight: '900', color: 'white', margin: 0 }}>{allocation.project?.project_code || 'N/A'}</p>
                </div>
                <div className="responsive-border-left" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '12px' }}>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.08em' }}>Shift</p>
                  <p style={{ fontSize: '14px', fontWeight: '900', color: '#FCD34D', margin: 0 }}>{formatTime(allocation.start_time || allocation.project?.start_time)}</p>
                </div>
                <div className="responsive-border-left" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '12px' }}>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.08em' }}>Radius</p>
                  <p style={{ fontSize: '15px', fontWeight: '900', color: 'white', margin: 0 }}>{allocation.customer?.radius_meters || 100}m</p>
                </div>
              </div>

              <div style={{ position: 'relative', padding: '0 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Laptop size={14} color="white" />{new Date(allocation.from_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                  <span style={{ color: '#34D399', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={16} />{planStats?.progress}% COMPLETE</span>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>{allocation.to_date ? new Date(allocation.to_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Ongoing'}<MonitorOff size={14} color="#F87171" /></span>
                </div>
                <div style={{ position: 'relative', height: '16px', marginBottom: '24px' }}>
                  <div style={{ position: 'absolute', top: '4px', left: 0, right: 0, height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${planStats?.progress || 0}%`, height: '100%', background: 'linear-gradient(90deg, #34D399, #60A5FA)', borderRadius: '10px', boxShadow: '0 0 12px rgba(52, 211, 153, 0.4)' }} />
                  </div>
                  <div style={{ position: 'absolute', left: `calc(${planStats?.progress || 0}% - 10px)`, top: '-2px', backgroundColor: 'white', color: '#2563EB', borderRadius: '50%', width: '20px', height: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, border: '2px solid white' }}><User size={12} fill="#2563EB" /></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1 }}><MapPin size={80} color="white" /></div>
                <div style={{ background: 'white', padding: '12px', borderRadius: '14px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', zIndex: 1 }}><MapPin size={24} color="#2563EB" /></div>
                <div style={{ zIndex: 1 }}>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.08em' }}>Site Location</p>
                  <p style={{ fontSize: '16px', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '0.02em' }}>{allocation.customer?.latitude}, {allocation.customer?.longitude}</p>
                </div>
              </div>

              <div style={{ marginTop: '8px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center' }}>
                <div><p style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Status</p><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isCheckedIn ? '#34D399' : 'rgba(255,255,255,0.4)' }} /><p style={{ fontSize: '11px', fontWeight: 900, color: isCheckedIn ? '#34D399' : 'rgba(255,255,255,0.8)', margin: 0 }}>{isCheckedIn ? 'IN' : (todayAttendance?.out_time ? 'OUT' : '--')}</p></div></div>
                <div><p style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>In Time</p><p style={{ fontSize: '11px', fontWeight: 900, color: 'white', margin: 0 }}>{formatTime(todayAttendance?.in_time)}</p></div>
                <div><p style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Out Time</p><p style={{ fontSize: '11px', fontWeight: 900, color: 'white', margin: 0 }}>{formatTime(todayAttendance?.out_time)}</p></div>
                <div><p style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Duration</p><p style={{ fontSize: '11px', fontWeight: 950, color: '#FCD34D', margin: 0 }}>{calculateDuration()}</p></div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.6)' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', width: '72px', height: '72px', borderRadius: '24px', display: 'grid', placeItems: 'center', margin: '0 auto 20px', border: '1px dashed rgba(255,255,255,0.3)' }}><CheckCircle2 size={36} style={{ opacity: 0.5, color: 'white' }}  /></div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'white' }}>No Project Allocation Today</div>
              <p style={{ fontSize: '14px', marginTop: '6px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>You're all set! Enjoy your day or check back later.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Stats Summary - Enriched Lite-Dar style */}
      <div style={{ padding: '0 16px', marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '0 4px' }}>
          <div style={{ width: '3px', height: '14px', background: '#10B981', borderRadius: '2px' }} />
          <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Quick Stats</h2>
        </div>
        <div style={{ 
          background: '#0F172A', 
          padding: '24px', 
          borderRadius: '28px', 
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', padding: '12px', borderRadius: '16px', color: 'white', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)' }}>
              <Clock3 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Leaves Used</div>
              <div style={{ fontSize: '22px', fontWeight: 950, color: 'white' }}>{stats.leavesUsed} <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>Days</span></div>
            </div>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '10px 18px', borderRadius: '14px', fontSize: '13px', fontWeight: 800, color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.2)', position: 'relative', zIndex: 1, backdropFilter: 'blur(4px)' }}>
            Annual
          </div>
        </div>
      </div>

      {/* 3. My Workspace - Enriched Lite style */}
      <div style={{ padding: '0 16px', marginTop: '24px' }}>
        <div className="grid-responsive-2">
          {[
            { title: 'Performance', desc: 'My analysis', icon: Activity, path: '/employee/analysis', gradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)', shadow: 'rgba(16, 185, 129, 0.2)' },
            { title: 'Calendar', desc: 'Full view', icon: Calendar, path: '/employee/calendar', gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', shadow: 'rgba(59, 130, 246, 0.2)' }
          ].map((item, idx) => (
            <button key={idx} className="card action-card-hover" style={{ 
              background: 'white', padding: '16px 16px', borderRadius: '20px', border: '1px solid #F1F5F9', 
              display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.03)', textAlign: 'left', width: '100%', position: 'relative', overflow: 'hidden'
            }} onClick={() => navigate(item.path)}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: item.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, boxShadow: `0 6px 12px ${item.shadow}`, position: 'relative', zIndex: 1 }}><item.icon size={18} /></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', marginBottom: '2px' }}>{item.title}</div>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Modules - Enriched Lite style */}
      <div style={{ padding: '0 16px', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '0 4px' }}>
          <div style={{ width: '3px', height: '14px', background: '#3B82F6', borderRadius: '2px' }} />
          <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Service Portal</h2>
        </div>
        <div className="grid-responsive-2">
          {[
            { title: 'Attendance', desc: 'History Logs', icon: History, path: '/attendance', gradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)', shadow: 'rgba(245, 158, 11, 0.2)' },
            { title: 'Profile', desc: 'Personal Info', icon: User, path: '/employee/profile', gradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)', shadow: 'rgba(16, 185, 129, 0.2)' },
            { title: 'Payslips', desc: 'Salary Details', icon: TrendingUp, path: '/employee/payslips', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', shadow: 'rgba(16, 185, 129, 0.2)' },
            { title: 'Apply Leave', desc: 'Request Off', icon: Calendar, path: '/employee/leave', gradient: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)', shadow: 'rgba(239, 68, 68, 0.2)' },
          ].map((item, idx) => (
            <button key={idx} className="card action-card-hover" style={{ 
              background: 'white', padding: '16px 16px', borderRadius: '20px', border: '1px solid #F1F5F9', 
              display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.03)', textAlign: 'left', width: '100%', position: 'relative', overflow: 'hidden'
            }} onClick={() => navigate(item.path)}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: item.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, boxShadow: `0 6px 12px ${item.shadow}`, position: 'relative', zIndex: 1 }}><item.icon size={18} /></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', marginBottom: '2px' }}>{item.title}</div>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Leave Balances Section - Enriched Lite-Dar style */}
      <div className="mobile-compact-section leave-stock-section" style={{ padding: '0 16px', marginTop: '24px', paddingBottom: '120px' }}>
        <div style={{ 
          background: '#1e293b', 
          padding: '24px', 
          borderRadius: '28px', 
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '14px', color: '#10B981' }}>
                <Palmtree size={22} />
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-0.01em' }}>LEAVE BALANCES</h2>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', position: 'relative', zIndex: 1 }}>
            {Object.entries(leaveBalances).map(([type, balance]) => (
              <div key={type} style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: '900', textTransform: 'uppercase', marginBottom: '0', letterSpacing: '0.08em' }}>{type}</p>
                <p style={{ fontSize: '20px', fontWeight: '950', color: 'white', margin: 0 }}>{balance} <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>Days</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
