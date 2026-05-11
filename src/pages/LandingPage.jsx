import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
  CreditCard,
  ShieldCheck,
  Zap,
  Globe,
  Database,
  Code2,
  Cpu
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Users className="text-blue-600" />,
      title: "Employee Management",
      description: "Comprehensive database for employee records, documents, and lifecycle management."
    },
    {
      icon: <Clock className="text-blue-600" />,
      title: "Attendance & Leave",
      description: "Real-time tracking, automated leave requests, and seamless integration with payroll."
    },
    {
      icon: <CreditCard className="text-blue-600" />,
      title: "Payroll & Compliance",
      description: "Automated salary calculations, tax filings, and statutory compliance management."
    }
  ];

  const techStack = [
    {
      icon: <Cpu className="text-blue-600" />,
      name: "ASP.NET Core",
      detail: "Enterprise-grade backend framework for robust performance."
    },
    {
      icon: <Code2 className="text-blue-600" />,
      name: "C#",
      detail: "Powerful object-oriented language for scalable business logic."
    },
    {
      icon: <Database className="text-blue-600" />,
      name: "MS SQL Server",
      detail: "Secure and high-performance relational database management."
    }
  ];

  return (
    <div className="landing-page" style={{ backgroundColor: '#fff' }}>
      {/* Navbar */}
      <nav style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--zoho-border)',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--zoho-blue)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>N</div>
          <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--zoho-dark)' }}>NestHR</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn-zoho"
            style={{ padding: '10px 24px' }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-section" style={{ textAlign: 'center', background: 'var(--landing-hero-bg)' }}>
        <h1 className="landing-title">
          The Operating System for <span style={{ color: 'var(--zoho-blue)' }}>Modern HR</span>
        </h1>
        <p className="landing-subtitle" style={{ maxWidth: '800px', margin: '0 auto 40px' }}>
          Streamline your entire employee lifecycle from recruitment to retirement.
          NestHR provides the tools you need to build a productive and engaged workforce.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button onClick={() => navigate('/register')} className="btn-zoho">
            Start Your Free Trial <ArrowRight size={18} />
          </button>
          <button className="btn-zoho-outline">
            Request a Demo
          </button>
        </div>

        {/* Hero Image / Illustration Placeholder */}
        <div style={{
          marginTop: '60px',
          background: 'white',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.1)',
          border: '1px solid var(--zoho-border)'
        }}>
          <div style={{
            width: '100%',
            height: '400px',
            backgroundColor: '#f1f5f9',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8'
          }}>
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3" alt="Dashboard Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="landing-section">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--zoho-dark)', marginBottom: '16px' }}>
            Everything you need in one place
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Built for businesses of all sizes, from startups to large enterprises.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(0, 103, 255, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: 'var(--zoho-dark)' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section style={{ backgroundColor: 'var(--zoho-dark)', color: 'white', padding: '80px 24px' }}>
        <div className="landing-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>
                Enterprise-Grade Performance
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', lineHeight: '1.6', marginBottom: '32px' }}>
                Our HRMS solution is built on a rock-solid foundation, ensuring scalability,
                security, and high performance for your most critical business processes.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {techStack.map((tech, index) => (
                  <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      padding: '12px',
                      borderRadius: '12px'
                    }}>
                      {tech.icon}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '700', marginBottom: '4px' }}>{tech.name}</h4>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{tech.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--zoho-blue) 0%, #00d2ff 100%)',
                borderRadius: '32px',
                padding: '40px',
                aspectRatio: '1/1',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <Zap size={64} style={{ marginBottom: '24px' }} />
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '16px' }}>99.9% Uptime</h3>
                <p style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Reliable infrastructure powered by Microsoft's enterprise ecosystem.
                </p>
              </div>
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                right: '-20px',
                backgroundColor: 'white',
                color: 'var(--zoho-dark)',
                padding: '24px',
                borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <ShieldCheck size={32} className="text-green-600" />
                <div>
                  <div style={{ fontWeight: '800' }}>ISO 27001</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Certified Security</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section" style={{ textAlign: 'center' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          padding: '80px 40px',
          borderRadius: '40px',
          border: '1px solid #bae6fd'
        }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--zoho-dark)', marginBottom: '24px' }}>
            Ready to transform your HR?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto 40px' }}>
            Join thousands of organizations that trust NestHR to manage their most valuable asset—their people.
          </p>
          <button onClick={() => navigate('/register')} className="btn-zoho" style={{ padding: '18px 48px', fontSize: '18px' }}>
            Get Started Now
          </button>
        </div>
      </section>

      {/* Zoho-inspired Footer */}
      <footer style={{
        backgroundColor: '#f8fafc',
        borderTop: '1px solid var(--zoho-border)',
        padding: '80px 24px 40px'
      }}>
        <div className="landing-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            marginBottom: '60px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: 'var(--zoho-blue)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}>N</div>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--zoho-dark)' }}>NestHR</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                The complete HR suite for the modern workforce.
                Manage payroll, attendance, and employee data with ease.
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Globe size={20} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
                {/* Social icons could go here */}
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '24px', color: 'var(--zoho-dark)' }}>Product</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Payroll Management</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Time & Attendance</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Employee Self Service</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Performance Review</a></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '24px', color: 'var(--zoho-dark)' }}>Company</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>About Us</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Contact</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Careers</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Press Kit</a></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '24px', color: 'var(--zoho-dark)' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Privacy Policy</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Terms of Service</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Security</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid var(--zoho-border)',
            paddingTop: '40px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px'
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              © 2024 NestHR Software. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: '24px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>English</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Region: Global</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
