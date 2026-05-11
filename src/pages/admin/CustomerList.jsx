import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building, Plus, MapPin, Phone, User, Globe, Edit2, Info } from 'lucide-react';
import { getCompanyCustomers, updateCompanyCustomer } from '../../supabaseHelpers';
import '../../index.css';

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (!adminData || !adminData.company_id) {
      navigate('/login');
      return;
    }

    try {
      const result = await getCompanyCustomers(adminData.company_id);
      if (result.success) {
        setCustomers(result.customers);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customer) => {
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    const newStatus = customer.status === 'Active' ? 'Inactive' : 'Active';
    
    try {
      const result = await updateCompanyCustomer(adminData.company_id, customer.customer_id, {
        ...customer,
        status: newStatus
      });
      
      if (result.success) {
        setCustomers(prev => prev.map(c => 
          c.customer_id === customer.customer_id ? { ...c, status: newStatus } : c
        ));
      } else {
        alert('Failed to update status: ' + result.error);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-bg)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--card-white)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid #E2E8F0' }}>
        <ChevronLeft
          size={24}
          style={{ position: 'absolute', left: '20px', cursor: 'pointer', color: 'var(--text-primary)' }}
          onClick={() => navigate('/admin')}
        />
        <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Customer Master</h1>
        <Plus
          size={20}
          style={{ position: 'absolute', right: '20px', cursor: 'pointer', color: 'var(--green)' }}
          onClick={() => navigate('/admin/customer/create')}
        />
      </div>

      {/* Main Content */}
      <div className="app-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Building size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: '8px' }}>
              No customers yet
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Create your first customer to get started
            </div>
            <button
              onClick={() => navigate('/admin/customer/create')}
              className="btn-primary"
            >
              Create Customer
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {customers.length} Customer{customers.length !== 1 ? 's' : ''}
            </div>

            {customers.map(customer => (
              <div
                key={customer.customer_id}
                className="card"
                style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.2s' }}
                onClick={() => navigate(`/admin/customer/edit/${customer.customer_id}`)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Top Row: Logo, Name, Status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {customer.customer_logo ? (
                        <img src={customer.customer_logo} alt={customer.customer_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Building size={28} style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {customer.customer_name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 'var(--font-semibold)', 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            backgroundColor: customer.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)', 
                            color: customer.status === 'Active' ? 'var(--green)' : '#64748B' 
                          }}>
                            {customer.status || 'Active'}
                          </span>
                        </div>
                      </div>
                      
                      {customer.industry_type && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#475569', marginBottom: '8px' }}>
                          <Globe size={12} />
                          {customer.industry_type}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
                        {customer.customer_contact_person && (
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} style={{ color: '#64748B' }} />
                            <span style={{ fontWeight: '500' }}>{customer.customer_contact_person}</span>
                          </div>
                        )}
                        {customer.customer_contact_phone && (
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={14} style={{ color: '#64748B' }} />
                            <span>{customer.customer_contact_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', backgroundColor: '#f1f5f9' }}></div>

                  {/* Bottom Section: Address and GPS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <MapPin size={16} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: '2px' }} />
                      <span>{customer.address}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#64748B' }}>GPS:</span> {customer.latitude?.toFixed(4)}, {customer.longitude?.toFixed(4)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#64748B' }}>Radius:</span> {customer.radius_meters}m
                        </div>
                        {customer.customer_branch && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '4px' }}>
                            <span style={{ fontWeight: '600', color: '#64748B' }}>Branch:</span> {customer.customer_branch}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(customer);
                          }}
                          style={{ 
                            fontSize: '12px', 
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            border: '1px solid #e2e8f0', 
                            backgroundColor: 'white', 
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Status Toggle
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/customer/edit/${customer.customer_id}`);
                          }}
                          style={{ 
                            fontSize: '12px', 
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            backgroundColor: 'var(--blue)', 
                            cursor: 'pointer',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '600'
                          }}
                        >
                          <Edit2 size={14} />
                          Edit Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;