import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPin, Calendar, Building, Briefcase, ClipboardCheck, User, UserCheck } from 'lucide-react';
import { getEmployeeNotifications } from '../supabaseHelpers';
import '../index.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    const loadNotificationCount = async () => {
      const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
      if (employeeData.employee_id && employeeData.company_id) {
        const result = await getEmployeeNotifications(employeeData.company_id, employeeData.employee_id);
        if (result.success) {
          const unread = result.notifications.filter(n => !n.read).length;
          setUnreadCount(unread);
        }
      }
    };

    loadNotificationCount();
  }, [location.pathname]);

  const employeeNavItems = [
    { path: '/employee/dashboard', icon: Home, label: 'Home' },
    { path: '/employee/allocation', icon: MapPin, label: 'Allocation' },
    { path: '/employee/checkin', icon: UserCheck, label: 'Check-In' },
    { path: '/employee/timesheet', icon: Calendar, label: 'Timesheet' },
    { path: '/employee/attendance', icon: Building, label: 'Attendance' }
  ];

  const adminNavItems = [
    { path: '/admin', icon: Home, label: 'Dashboard' },
    { path: '/admin/customer', icon: Building, label: 'Customers' },
    { path: '/admin/project', icon: Briefcase, label: 'Projects' },
    { path: '/admin/review', icon: ClipboardCheck, label: 'Review' },
  ];

  const navItems = isAdminRoute ? adminNavItems : employeeNavItems;

  return (
    <div className="bottom-nav" style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: 'var(--card-white)',
      borderTop: '1px solid #E2E8F0',
      padding: '12px 0',
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      boxShadow: '0 -4px 10px rgba(0,0,0,0.02)',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 80
    }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <div 
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: isActive ? 'var(--green)' : 'var(--text-secondary)',
              position: 'relative'
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '10px', fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-medium)' }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BottomNav;
