import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, BarChart3, CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react';
import { getEmployeeTimesheet, getEmployeeAllocations, getCompanyConfiguration } from '../../supabaseHelpers';

const EmployeeAnalysis = () => {
  const navigate = useNavigate();
  const { id: paramEmployeeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    onTimePercentage: 0,
    averageWorkedHours: 0,
    punctualityScore: 0,
    punchInTime: '09:00',
    isEarlyBird: false
  });

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        
        const company_id = employeeData.company_id || adminData.company_id;
        const employee_id = paramEmployeeId || employeeData.employee_id;

        if (!company_id || !employee_id) return;

        const [timesheet, allocations, configResult] = await Promise.all([
          getEmployeeTimesheet(company_id, employee_id, 12), // 12 weeks back
          getEmployeeAllocations(company_id, employee_id),
          getCompanyConfiguration(company_id)
        ]);

        const punchInTime = configResult.success ? configResult.config.punch_in_time : '09:00';
        const [configHour, configMinute] = punchInTime.split(':').map(Number);
        const graceLimitMinutes = configHour * 60 + configMinute + 15;

        // Calculate stats
        const totalProjects = allocations.length;
        const completedProjects = allocations.filter(a => a.allocation_status === 'Completed').length;
        
        let onTimeCount = 0;
        let totalAttendances = 0;
        let totalHours = 0;
        let isEarlyBird = false;

        timesheet.forEach(month => {
          month.entries.forEach(entry => {
            totalAttendances++;
            // Using company configuration punch-in time with 15m grace
            if (entry.start !== '--') {
              const [h, m] = entry.start.split(':').map(Number);
              const entryMinutes = h * 60 + m;
              
              // If last entry was before the actual scheduled time (no grace)
              if (totalAttendances === 1 && entryMinutes < (configHour * 60 + configMinute)) {
                isEarlyBird = true;
              }

              if (entryMinutes <= graceLimitMinutes) {
                onTimeCount++;
              }
            }
            // Parse total hours (HH:MM:SS)
            const [h, m] = entry.total.split(':').map(Number);
            totalHours += h + (m / 60);
          });
        });

        const onTimePercentage = totalAttendances > 0 ? Math.round((onTimeCount / totalAttendances) * 100) : 0;
        const averageWorkedHours = totalAttendances > 0 ? (totalHours / totalAttendances).toFixed(1) : 0;

        setStats({
          totalProjects,
          completedProjects,
          onTimePercentage,
          averageWorkedHours,
          punctualityScore: onTimePercentage, // Simplistic score
          punchInTime,
          isEarlyBird
        });
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <p>Analyzing your performance...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '100px' }}>
      {/* Header */}
      <div className="shift-for-menu" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0' }}>
        <ChevronLeft size={24} style={{ cursor: 'pointer' }} onClick={() => navigate(-1)} />
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Performance Analysis</h1>
      </div>

      <div style={{ padding: '20px' }}>
        {stats.isEarlyBird && (
          <div style={{ 
            backgroundColor: '#ECFDF5', 
            border: '1px solid #10B981', 
            borderRadius: '24px', 
            padding: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            marginBottom: '24px',
            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '-10px', 
              right: '-10px', 
              fontSize: '48px', 
              opacity: 0.1,
              transform: 'rotate(15deg)'
            }}>🏆</div>
            <div style={{ 
              backgroundColor: '#10B981', 
              width: '48px', 
              height: '48px', 
              borderRadius: '16px', 
              display: 'grid', 
              placeItems: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <TrendingUp size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#065F46', marginBottom: '2px' }}>Top Performer!</div>
              <div style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>You arrived early today. Great dedication!</div>
            </div>
          </div>
        )}

        {/* Punctuality Card */}
        <div style={{ 
          backgroundColor: '#0F172A', 
          borderRadius: '24px', 
          padding: '24px', 
          color: 'white',
          marginBottom: '20px',
          backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 600 }}>Punctuality Score</div>
              <div style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px' }}>{stats.punctualityScore}%</div>
            </div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '16px' }}>
              <TrendingUp size={24} color="#10B981" />
            </div>
          </div>
          <div style={{ marginTop: '20px', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${stats.punctualityScore}%`, height: '100%', backgroundColor: '#10B981' }} />
          </div>
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#94A3B8' }}>You arrived on time for {stats.onTimePercentage}% of your shifts.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <AnalysisCard 
            title="Projects Done" 
            value={stats.completedProjects} 
            total={stats.totalProjects}
            icon={CheckCircle2} 
            color="#3B82F6" 
          />
          <AnalysisCard 
            title="Avg. Hours" 
            value={stats.averageWorkedHours} 
            sub="per day"
            icon={Clock} 
            color="#8B5CF6" 
          />
          <AnalysisCard 
            title="Total Projects" 
            value={stats.totalProjects} 
            icon={Target} 
            color="#F59E0B" 
          />
          <AnalysisCard 
            title="Arrival" 
            value={stats.onTimePercentage < 90 ? 'Improve' : 'Excellent'} 
            sub="Punctuality"
            icon={BarChart3} 
            color="#10B981" 
          />
        </div>

        {/* Project Progress */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>Project Completion</h3>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <span style={{ fontSize: '14px', color: '#64748B' }}>Total Progress</span>
               <span style={{ fontSize: '14px', fontWeight: 700 }}>{stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}%</span>
             </div>
             <div style={{ height: '10px', backgroundColor: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
               <div style={{ width: `${stats.totalProjects > 0 ? (stats.completedProjects / stats.totalProjects) * 100 : 0}%`, height: '100%', backgroundColor: '#3B82F6' }} />
             </div>
             <p style={{ marginTop: '16px', fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
               You have successfully completed {stats.completedProjects} out of {stats.totalProjects} projects allocated to you.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalysisCard = ({ title, value, sub, total, icon: Icon, color }) => (
  <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
    <div style={{ backgroundColor: `${color}15`, color: color, width: '40px', height: '40px', borderRadius: '12px', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
      <Icon size={20} />
    </div>
    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
      {value}{total ? <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 500 }}>/{total}</span> : ''}
    </div>
    {sub && <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{sub}</div>}
  </div>
);

export default EmployeeAnalysis;
