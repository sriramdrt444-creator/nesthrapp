import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Search, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Clock, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { 
  getCompanyEmployees, 
  getCompanyMonthlyAttendance, 
  getCompanyConfiguration,
  getCompanyProjects
} from '../../supabaseHelpers';

const PerformanceAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [performanceData, setPerformanceData] = useState([]);
  const [summary, setSummary] = useState({
    avgPunctuality: 0,
    activeProjects: 0,
    totalManHours: 0,
    topPerformer: 'N/A'
  });

  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const company_id = adminData.company_id;

  useEffect(() => {
    if (company_id) {
      fetchData();
    }
  }, [company_id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get last 30 days
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      const [empResult, attResult, configResult, projResult] = await Promise.all([
        getCompanyEmployees(company_id),
        getCompanyMonthlyAttendance(company_id, startStr, endStr),
        getCompanyConfiguration(company_id),
        getCompanyProjects(company_id)
      ]);

      if (empResult.success && attResult.success) {
        const emps = empResult.employees;
        const attendance = attResult.attendance;
        const config = configResult.success ? configResult.config : { punch_in_time: '09:00' };
        
        // Punctuality limit
        const [hour, minute] = config.punch_in_time.split(':').map(Number);
        const graceLimitMinutes = hour * 60 + minute + 15;

        // Process each employee
        const processed = emps.map(emp => {
          const empAtt = attendance.filter(a => a.employee_id === emp.employee_id);
          // Count as present if they have any record or specific status
          const totalRecords = empAtt.length;
          
          let onTimeCount = 0;
          empAtt.forEach(a => {
            if (a.in_time) {
              const inDate = new Date(a.in_time);
              // Extract hours and minutes in local time
              const inMinutes = inDate.getHours() * 60 + inDate.getMinutes();
              if (inMinutes <= graceLimitMinutes) {
                onTimeCount++;
              }
            }
          });

          const punctuality = totalRecords > 0 ? Math.round((onTimeCount / totalRecords) * 100) : 0;
          
          return {
            ...emp,
            totalPresent: totalRecords,
            punctuality,
            onTimeCount
          };
        });

        setPerformanceData(processed);
        
        // Calculate summary
        const avgPunc = processed.length > 0 ? Math.round(processed.reduce((sum, e) => sum + e.punctuality, 0) / processed.length) : 0;
        const activeProjs = projResult.success ? projResult.projects.length : 0;
        const top = [...processed].sort((a, b) => b.punctuality - a.punctuality)[0];

        setSummary({
          avgPunctuality: avgPunc,
          activeProjects: activeProjs,
          totalManHours: attendance.length * 8, // Estimated
          topPerformer: top ? top.name : 'N/A'
        });
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = performanceData.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#64748B', fontWeight: 600 }}>Analyzing company performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="shift-for-menu" style={{ 
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
        padding: '32px 24px 60px', 
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <ChevronLeft 
            size={24} 
            style={{ cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '4px' }} 
            onClick={() => navigate('/admin')} 
          />
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Performance Analysis</h1>
        </div>

        {/* Summary Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '12px' 
        }}>
          <SummaryCard 
            label="Avg. Punctuality" 
            value={`${summary.avgPunctuality}%`} 
            icon={TrendingUp} 
            trend="+2.5%" 
            isUp={true}
          />
          <SummaryCard 
            label="Active Projects" 
            value={summary.activeProjects} 
            icon={Target} 
          />
          <SummaryCard 
            label="Top Performer" 
            value={summary.topPerformer} 
            icon={Users} 
          />
          <SummaryCard 
            label="Total Hours" 
            value={summary.totalManHours} 
            icon={Clock} 
          />
        </div>
      </div>

      {/* List Section */}
      <div style={{ marginTop: '-24px', padding: '0 20px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '24px', 
          padding: '24px', 
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          minHeight: '400px'
        }}>
          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="text" 
                placeholder="Search staff..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 12px 12px 48px', 
                  borderRadius: '16px', 
                  border: '1px solid #E2E8F0', 
                  fontSize: '14px',
                  backgroundColor: '#F8FAFC'
                }}
              />
            </div>
            <button style={{ padding: '12px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: 'white' }}>
              <Filter size={18} color="#64748B" />
            </button>
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>Staff Efficiency</h3>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredData.map((emp) => (
              <EmployeePerformanceRow key={emp.employee_id} employee={emp} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon: Icon, trend, isUp }) => (
  <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '12px' }}>
        <Icon size={20} color="white" />
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 700, color: isUp ? '#10B981' : '#EF4444' }}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      )}
    </div>
    <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>{value}</div>
  </div>
);

const EmployeePerformanceRow = ({ employee }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate(`/admin/performance/employee/${employee.employee_id}`)}
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '12px', 
        padding: '16px', 
        borderRadius: '20px', 
        border: '1px solid #F1F5F9',
        backgroundColor: 'white',
        transition: 'transform 0.2s',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
          <img 
            src={employee.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random`} 
            alt={employee.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {employee.name}
            {employee.punctuality >= 95 && <span title="Top Performer" style={{ fontSize: '14px' }}>🏆</span>}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{employee.designation || 'Staff'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: employee.punctuality > 85 ? '#10B981' : '#F59E0B' }}>{employee.punctuality}%</div>
          <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>Punctuality</div>
        </div>
        <button style={{ color: '#94A3B8', background: 'none', border: 'none', padding: '4px' }}>
          <MoreHorizontal size={18} />
        </button>
      </div>
      
      <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
        <div 
          style={{ 
            position: 'absolute', 
            left: 0, 
            top: 0, 
            height: '100%', 
            width: `${employee.punctuality}%`, 
            backgroundColor: employee.punctuality > 85 ? '#10B981' : '#F59E0B',
            borderRadius: '3px',
            transition: 'width 0.5s ease-out'
          }} 
        />
      </div>
    </div>
  );
};

export default PerformanceAnalysis;
