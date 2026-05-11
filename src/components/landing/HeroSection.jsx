import React from 'react';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-32">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-50 z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-50 rounded-full blur-3xl opacity-50 z-0"></div>

      <div className="landing-container relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-[#0067FF] text-sm font-bold mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-[#0067FF]"></span>
            2026 Version Launched with AI Features
          </div>
          
          <h1 className="landing-title mb-8">
            India's No.1 Customized <span className="text-[#0067FF]">Payroll & HRMS</span> Application
          </h1>
          
          <p className="landing-subtitle max-w-2xl mx-auto mb-10">
            Trusted by 365+ Small to Large organizations across India. 
            Processing 12,00,000+ payslips monthly with "Trusted Payroll and HRMS Software".
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/register')}
              className="btn-zoho group"
            >
              Get Free Demo 
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="btn-zoho-outline group">
              <Play size={20} fill="currentColor" />
              Watch Product Video
            </button>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm font-semibold text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" /> Multi-Units Incorporation
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" /> Client Server Technology
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" /> 24/7 Premium Support
            </div>
          </div>
        </div>

        {/* Dashboard Mockup Placeholder */}
        <div className="mt-20 relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 h-32 bottom-0"></div>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 transform hover:scale-[1.01] transition-transform duration-500">
             <div className="bg-gray-50 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3" 
                  alt="HRMS Dashboard" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <Play size={32} className="text-[#0067FF] ml-1" fill="currentColor" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
