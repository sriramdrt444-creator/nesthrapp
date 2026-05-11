import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: "HRMS STANDARD",
    size: "Small Business",
    employees: "1 - 49 Employees",
    features: ["Basic Payroll", "Attendance Tracking", "Leave Management", "Self Service Portal", "PF/ESI Reports"],
    color: "gray"
  },
  {
    name: "HRMS EXPRESS",
    size: "Mid-Size Business",
    employees: "50 - 999 Employees",
    features: ["All Standard Features", "Bio-metric Integration", "Tally Integration", "Audit Reports", "Tax Projections", "Recruitment Module"],
    featured: true,
    color: "blue"
  },
  {
    name: "HRMS ENTERPRISES",
    size: "Large Business",
    employees: "1000 - 9999 Employees",
    features: ["All Express Features", "Multi-Unit Support", "Advanced Analytics", "Training & Appraisal", "Custom Org Charts", "Premium 24/7 Support"],
    color: "indigo"
  },
  {
    name: "HRMS VISTA",
    size: "Very Large Size",
    employees: "10,000+ Employees",
    features: ["Everything Included", "Dedicated Server Option", "Enterprise Customization", "Global Compliance", "On-site Integration", "Strategic HR Tools"],
    color: "slate"
  }
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="landing-container">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-extrabold text-[#1A202C] mb-6">
            Scalable Solutions for Every Size
          </h2>
          <p className="text-lg text-gray-600">
            Choose the version that fits your business needs. 
            All plans include our core "Trusted Payroll and HRMS" engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`flex flex-col p-10 rounded-3xl border ${
                plan.featured 
                ? 'border-[#0067FF] shadow-2xl relative scale-105 z-10' 
                : 'border-gray-100'
              } bg-white transition-all duration-300 hover:border-[#0067FF]`}
            >
              {plan.featured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-[#0067FF] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                  Recommended
                </div>
              )}
              
              <div className="mb-8">
                <span className="text-sm font-bold text-[#0067FF] uppercase tracking-widest">{plan.size}</span>
                <h3 className="text-2xl font-extrabold text-[#1A202C] mt-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm mt-4 font-semibold">{plan.employees}</p>
              </div>

              <div className="flex-1">
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                      <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-[#0067FF]" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => navigate('/register')}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  plan.featured 
                  ? 'bg-[#0067FF] text-white hover:bg-[#0056D6]' 
                  : 'bg-gray-50 text-[#1A202C] hover:bg-gray-100'
                }`}
              >
                Get Started <ArrowRight size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 font-medium">
            Looking for something specific? <a href="#contact" className="text-[#0067FF] font-bold hover:underline">Contact our sales team</a> for a custom quote.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
