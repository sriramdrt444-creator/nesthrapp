import React from 'react';
import { 
  Globe, UserCheck, Camera, Layers, Cpu, Share2, BarChart3, 
  CreditCard, ShieldCheck, Mail, Users, FileCheck, Zap, 
  Settings2, Activity, PieChart 
} from 'lucide-react';

const specialties = [
  { icon: <Globe />, title: "Web based HRMS", desc: "Access your HR tools anywhere, anytime with our cloud-ready platform." },
  { icon: <UserCheck />, title: "Employee Self Service", desc: "Empower employees with personal portals for leave, payslips, and profiles." },
  { icon: <Camera />, title: "Selfie Attendance", desc: "Modern geofenced attendance with selfie verification for remote teams." },
  { icon: <Layers />, title: "Multi Branch Support", desc: "Manage multiple branches seamlessly from a single centralized server." },
  { icon: <Cpu />, title: "Bio-Metrics Integration", desc: "Seamless integration with Face & Fingerprint machines for automated logs." },
  { icon: <Share2 />, title: "Dynamic Org Chart", desc: "Editable and dragging organization charts for visual workforce management." },
  { icon: <Zap />, title: "Speed Performance", desc: "Handle 50,000+ entries in under 1 minute with optimized database logic." },
  { icon: <BarChart3 />, title: "Online Payroll", desc: "Comprehensive payroll with daily, weekly, or monthly salary cycles." },
  { icon: <Mail />, title: "Payslip Automation", desc: "Automatic payslip generation and direct email options for employees." },
  { icon: <ShieldCheck />, title: "Statutory Compliance", desc: "Built-in PF, ESI, and Statuary reports (Form 12, 3, 5, 6A, etc.)." },
  { icon: <Activity />, title: "OT Calculation", desc: "Precise Overtime calculation with separate or integrated salary options." },
  { icon: <PieChart />, title: "Tax Projection", desc: "Automated tax declarations and projections for hassle-free filing." },
  { icon: <Settings2 />, title: "Tally Integration", desc: "Direct integration with Tally for seamless accounting data transfer." },
  { icon: <Users />, title: "Recruitment & Appraisal", desc: "End-to-end recruitment tracking and performance appraisal systems." },
  { icon: <FileCheck />, title: "Audit Ready Reports", desc: "Walmart, RAP, and Audit-specific reports generated with one click." },
  { icon: <CreditCard />, title: "Settlement Management", desc: "Smooth handling of full and final settlements during exit." }
];

const FeatureSection = () => {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="landing-container">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-extrabold text-[#1A202C] mb-6">
            Advanced Features for Modern HR
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to manage your workforce efficiently, from attendance to statutory compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {specialties.map((item, index) => (
            <div 
              key={index} 
              className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-[#0067FF] hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-[#0067FF] mb-6 group-hover:scale-110 transition-transform">
                {React.cloneElement(item.icon, { size: 28 })}
              </div>
              <h3 className="text-lg font-bold text-[#1A202C] mb-3">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
