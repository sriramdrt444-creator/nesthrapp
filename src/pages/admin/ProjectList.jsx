import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Briefcase, Plus, Building } from 'lucide-react';
import { getCompanyProjects } from '../../supabaseHelpers';
import '../../index.css';

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (!adminData || !adminData.company_id) {
      navigate('/login');
      return;
    }

    try {
      const result = await getCompanyProjects(adminData.company_id);
      if (result.success) {
        setProjects(result.projects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
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
        <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', margin: 0 }}>Project Master</h1>
        <Plus
          size={20}
          style={{ position: 'absolute', right: '20px', cursor: 'pointer', color: 'var(--green)' }}
          onClick={() => navigate('/admin/project/create')}
        />
      </div>

      {/* Main Content */}
      <div className="app-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Briefcase size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: '8px' }}>
              No projects yet
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Create your first project to get started
            </div>
            <button
              onClick={() => navigate('/admin/project/create')}
              className="btn-primary"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {projects.length} Project{projects.length !== 1 ? 's' : ''}
            </div>

            {projects.map(project => (
              <div
                key={project.project_id}
                className="card"
                style={{ padding: '20px', cursor: 'pointer' }}
                onClick={() => navigate('/admin/project/create')} // Could navigate to project details
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#8B5CF615',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#8B5CF6'
                  }}>
                    <Briefcase size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {project.project_code} - {project.project_name}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building size={14} />
                      {project.customer_master?.customer_name || 'No Customer'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Expected Hours/Day: {project.expected_hours_per_day}h
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

export default ProjectList;