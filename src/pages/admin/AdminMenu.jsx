import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, Building, MapPin, ClipboardCheck, ChevronRight, DollarSign, Clock, CheckCircle, Calendar, LayoutGrid, LogOut, TrendingUp } from 'lucide-react';
import logo from '../logo.png';
import '../../index.css';

const AdminMenu = () => {
  const navigate = useNavigate();
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');

  const menuItems = [
    { title: 'Customer', desc: 'GPS & locations', icon: Building, color: '#3B82F6', path: '/admin/customer', gradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' },
    { title: 'Projects', desc: 'Project management', icon: Briefcase, color: '#8B5CF6', path: '/admin/project', gradient: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)' },
    { title: 'Employees', desc: 'Staff directory', icon: Users, color: '#F59E0B', path: '/admin/employee', gradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' },
    { title: 'Allocation', desc: 'Staff assignments', icon: MapPin, color: '#10B981', path: '/admin/allocate', gradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' },
    { title: 'Attendance', desc: 'Daily check-ins', icon: Clock, color: '#06B6D4', path: '/admin/daily-checkin', gradient: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)' },
    { title: 'Review', desc: 'Approve logs', icon: ClipboardCheck, color: '#EF4444', path: '/admin/review', gradient: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)' },
    { title: 'Leave Alloc', desc: 'Set balances', icon: ClipboardCheck, color: '#22C55E', path: '/admin/leave', gradient: 'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)' },
    { title: 'Leave Appr', desc: 'Approve requests', icon: CheckCircle, color: '#10B981', path: '/admin/leave-approval', gradient: 'linear-gradient(135deg, #34D399 0%, #059669 100%)' },
    { title: 'Monthly', desc: 'X-Mark Review', icon: Calendar, color: '#6366F1', path: '/admin/monthly-review', gradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)' },
    { title: 'Payroll', desc: 'Salary & Tax', icon: DollarSign, color: '#F97316', path: '/admin/payroll-tax', gradient: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)' },
    { title: 'Analysis', desc: 'Performance', icon: TrendingUp, color: '#8B5CF6', path: '/admin/performance', gradient: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminData');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
      {/* Premium Header */}
      <div style={{ 
        background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)', 
        padding: '0 20px', 
        height: '64px',
        minHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'white',
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '10px', 
            backgroundColor: 'white', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '4px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}>
            <img src={logo} alt="NestHR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: '800', margin: 0, letterSpacing: '-0.3px' }}>NestHR Admin</h1>
            <p style={{ fontSize: '10px', opacity: 0.6, margin: 0 }}>{adminData.admin_name || 'Admin'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            borderRadius: '10px', 
            padding: '6px 12px', 
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <p style={{ fontSize: '12px', fontWeight: '700', margin: 0, opacity: 0.9 }}>{adminData.company_name?.split(' ')[0] || 'NestHR'}</p>
          </div>
          <button 
            onClick={handleLogout}
            style={{ padding: '6px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div style={{ marginTop: '20px', padding: '0 16px 40px', flex: 1 }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px' 
        }}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index}
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  cursor: 'pointer', 
                  padding: '20px 12px', 
                  gap: '10px',
                  borderRadius: '22px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  border: '1px solid #E2E8F0',
                  backgroundColor: 'white'
                }}
                onClick={() => navigate(item.path)}
              >
                <div style={{ 
                  width: '46px', height: '46px', borderRadius: '14px', 
                  background: item.gradient, display: 'flex', 
                  justifyContent: 'center', alignItems: 'center', color: 'white',
                  boxShadow: `0 6px 12px ${item.color}22`
                }}>
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ fontSize: '10px', color: '#64748B', lineHeight: '1.2' }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Branding */}
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>NestHR Cloud v2.4.0</p>
      </div>
    </div>
  );
};

export default AdminMenu;
