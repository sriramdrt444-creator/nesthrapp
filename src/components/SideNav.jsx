import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPin, Calendar, Building, Briefcase, ClipboardCheck, User, Bell, LogOut, TrendingUp, UserCheck } from 'lucide-react';
import '../index.css';

const SideNav = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleNavigation = (path) => {
    navigate(path);
    onClose(); // Close menu after navigation
  };

  const employeeNavItems = [
    { path: '/employee/dashboard', icon: Home, label: 'Home' },
    { path: '/employee/allocation', icon: MapPin, label: 'Allocation' },
    { path: '/employee/checkin', icon: UserCheck, label: 'Check-In' },
    { path: '/employee/checkout', icon: MapPin, label: 'Check-Out' },
    { path: '/employee/timesheet', icon: Calendar, label: 'Timesheet' },
    { path: '/employee/attendance', icon: ClipboardCheck, label: 'Attendance' },
    { path: '/employee/profile', icon: User, label: 'Profile' }
  ];

  const adminNavItems = [
    { path: '/admin', icon: Home, label: 'Dashboard' },
    { path: '/admin/customer', icon: Building, label: 'Customers' },
    { path: '/admin/project', icon: Briefcase, label: 'Projects' },
    { path: '/admin/performance', icon: TrendingUp, label: 'Performance' },
    { path: '/admin/review', icon: ClipboardCheck, label: 'Review' }
  ];

  const navItems = isAdminRoute ? adminNavItems : employeeNavItems;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40
          }}
          onClick={onClose}
        />
      )}

      {/* Side Navigation */}
      <div className={`side-nav ${isOpen ? 'open' : ''}`}>
        <div className="side-nav-brand">
          <div className="side-nav-logo">N</div>
          <div>
            <div className="side-nav-title">NESTHR</div>
            <div className="side-nav-subtitle">GeoTrack</div>
          </div>
        </div>
        <div className="side-nav-items">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                type="button"
                className={`side-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
          <button
            type="button"
            className="side-nav-item"
            style={{ color: '#EF4444' }}
            onClick={() => {
              localStorage.clear();
              navigate('/login');
              onClose();
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SideNav;
