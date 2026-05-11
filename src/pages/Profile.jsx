import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Bell, Settings, LogOut, Camera, Edit2, Save, X } from 'lucide-react';
import { getEmployeeNotifications, markNotificationAsRead } from '../supabaseHelpers';
import '../index.css';

const Profile = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Load employee data from localStorage
    const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
    if (!employeeData.employee_id) {
      navigate('/login');
      return;
    }
    setEmployee(employeeData);
    setEditData(employeeData);

    // Load notifications
    const loadNotifications = async () => {
      const result = await getEmployeeNotifications(employeeData.company_id, employeeData.employee_id);
      if (result.success) {
        setNotifications(result.notifications);
      }
    };
    loadNotifications();
  }, [navigate]);

  const handleSaveProfile = () => {
    // Update localStorage and state
    localStorage.setItem('employeeData', JSON.stringify(editData));
    setEmployee(editData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeData');
    localStorage.removeItem('adminData');
    navigate('/login');
  };

  const handleMarkNotificationAsRead = async (id) => {
    const result = await markNotificationAsRead(employee.company_id, employee.employee_id, id);
    if (result.success) {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!employee) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-bg)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--card-white)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid #E2E8F0' }}>
        <ChevronLeft
          size={24}
          style={{ position: 'absolute', left: '20px', cursor: 'pointer', color: 'var(--text-primary)' }}
          onClick={() => navigate('/dashboard')}
        />
        <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Profile & Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', backgroundColor: 'var(--card-white)', borderBottom: '1px solid #E2E8F0' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            flex: 1,
            padding: '16px',
            backgroundColor: activeTab === 'profile' ? 'var(--green)' : 'transparent',
            color: activeTab === 'profile' ? 'white' : 'var(--text-primary)',
            border: 'none',
            fontSize: '14px',
            fontWeight: 'var(--font-medium)',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <User size={16} style={{ marginRight: '8px' }} />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            flex: 1,
            padding: '16px',
            backgroundColor: activeTab === 'notifications' ? 'var(--green)' : 'transparent',
            color: activeTab === 'notifications' ? 'white' : 'var(--text-primary)',
            border: 'none',
            fontSize: '14px',
            fontWeight: 'var(--font-medium)',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Bell size={16} style={{ marginRight: '8px' }} />
          Notifications
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'var(--danger)',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            flex: 1,
            padding: '16px',
            backgroundColor: activeTab === 'settings' ? 'var(--green)' : 'transparent',
            color: activeTab === 'settings' ? 'white' : 'var(--text-primary)',
            border: 'none',
            fontSize: '14px',
            fontWeight: 'var(--font-medium)',
            cursor: 'pointer'
          }}
        >
          <Settings size={16} style={{ marginRight: '8px' }} />
          Settings
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {activeTab === 'profile' && (
          <div className="card" style={{ marginBottom: '20px' }}>
            {/* Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                fontWeight: 'bold',
                marginRight: '16px'
              }}>
                {employee.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'var(--font-semibold)', margin: '0 0 4px 0' }}>
                  {employee.name}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                  Employee ID: {employee.employee_id}
                </p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    backgroundColor: 'var(--green)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Edit2 size={16} />
                  Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleSaveProfile}
                    style={{
                      backgroundColor: 'var(--green)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData(employee);
                    }}
                    style={{
                      backgroundColor: 'var(--danger)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Profile Fields */}
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', fontWeight: 'var(--font-medium)' }}>{employee.name}</div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', fontWeight: 'var(--font-medium)' }}>{employee.email}</div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', fontWeight: 'var(--font-medium)' }}>{employee.phone || 'Not provided'}</div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Role
                </label>
                <div style={{ fontSize: '16px', fontWeight: 'var(--font-medium)' }}>{employee.role || 'Employee'}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'var(--font-semibold)', marginBottom: '16px' }}>
              Notifications
            </h3>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="card"
                  style={{
                    marginBottom: '12px',
                    cursor: 'pointer',
                    backgroundColor: notification.read ? 'var(--card-white)' : 'rgba(16, 185, 129, 0.05)',
                    borderLeft: notification.read ? 'none' : '4px solid var(--green)'
                  }}
                  onClick={() => handleMarkNotificationAsRead(notification.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: 'var(--font-semibold)',
                        margin: '0 0 4px 0',
                        color: notification.read ? 'var(--text-primary)' : 'var(--green)'
                      }}>
                        {notification.title}
                      </h4>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                        {notification.message}
                      </p>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {formatTime(notification.time)}
                      </span>
                    </div>
                    {!notification.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--green)',
                        flexShrink: 0,
                        marginTop: '8px'
                      }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'var(--font-semibold)', marginBottom: '16px' }}>
              Settings
            </h3>

            <div className="card" style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', marginBottom: '16px' }}>
                Notifications
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Check-in Reminders</span>
                  <input type="checkbox" defaultChecked />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Timesheet Approvals</span>
                  <input type="checkbox" defaultChecked />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>New Allocations</span>
                  <input type="checkbox" defaultChecked />
                </label>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', marginBottom: '16px' }}>
                Privacy
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Location Tracking</span>
                  <input type="checkbox" defaultChecked />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Photo Capture</span>
                  <input type="checkbox" defaultChecked />
                </label>
              </div>
            </div>

            <div className="card">
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'var(--font-semibold)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;