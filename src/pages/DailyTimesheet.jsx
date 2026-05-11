import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, Calendar } from 'lucide-react';
import { getEmployeeTimesheet } from '../supabaseHelpers';
import '../index.css';

const DailyTimesheet = () => {
  const navigate = useNavigate();
  const [timesheetData, setTimesheetData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimesheet = async () => {
      try {
        const employee = JSON.parse(localStorage.getItem('employeeData') || '{}');
        if (!employee.company_id || !employee.employee_id) {
          console.error('Employee not logged in');
          return;
        }

        const data = await getEmployeeTimesheet(employee.company_id, employee.employee_id);
        setTimesheetData(data);
      } catch (error) {
        console.error('Error loading timesheet:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimesheet();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--dark-navy)' }}>
        <div style={{ color: 'white' }}>Loading timesheet...</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--dark-navy)' }}>
      <div className="shift-for-menu" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ChevronLeft size={24} style={{ cursor: 'pointer' }} onClick={() => navigate('/employee/dashboard')} />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Timesheet</h1>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Review your logged hours by month</div>
          </div>
        </div>
        <Filter size={22} style={{ cursor: 'pointer' }} />
      </div>

      <div style={{
        flex: 1,
        backgroundColor: 'var(--light-bg)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 20px 10px 20px' }}>
          <div style={{
            backgroundColor: 'var(--card-white)',
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 20px rgba(15, 45, 92, 0.08)'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Current period</div>
              <div style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--green)', fontWeight: 'var(--font-semibold)' }}>
              <Calendar size={18} />
              <span>Monthly summary</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' }}>
          {timesheetData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              No timesheet entries found
            </div>
          ) : (
            timesheetData.map((section) => (
              <div key={section.range} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Month</div>
                    <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)' }}>{section.range}</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{section.summary}</div>
                </div>

                <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {section.entries.map((item, index) => (
                    <div key={`${item.date}-${index}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', padding: '14px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                      <div style={{ minWidth: '148px', flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content', padding: '6px 10px', borderRadius: '999px', backgroundColor: '#E2E8F0', color: 'var(--text-primary)', fontSize: '11px', fontWeight: '600' }}>
                          {item.category}
                        </span>
                        <div style={{ fontSize: '13px', fontWeight: '600', lineHeight: '1.4', color: 'var(--text-primary)' }}>{item.project}</div>
                      </div>

                      <div style={{ minWidth: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: '700', fontSize: '20px' }}>
                        ₹
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', flex: '1 1 200px' }}>
                        <div style={{ borderRadius: '14px', backgroundColor: '#F8FAFC', padding: '10px', fontSize: '12px', color: 'var(--text-primary)', textAlign: 'center' }}>In: {item.start}</div>
                        <div style={{ borderRadius: '14px', backgroundColor: '#F8FAFC', padding: '10px', fontSize: '12px', color: 'var(--text-primary)', textAlign: 'center' }}>Out: {item.end}</div>
                        <div style={{ borderRadius: '14px', backgroundColor: '#F8FAFC', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>{item.date}</div>
                      </div>

                      <div style={{ minWidth: '110px', padding: '12px 14px', borderRadius: '16px', backgroundColor: '#F1F5F9', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textAlign: 'center' }}>
                        {item.total}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyTimesheet;
