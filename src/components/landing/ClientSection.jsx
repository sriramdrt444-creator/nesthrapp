import React from 'react';

const clients = [
  "Ramraj Cotton", "KM Knit Wears", "Kauvery Hospital", "Kirtilal Kalidas Jewellers",
  "Born Babies", "South Indian Coffee House", "Annapoorna Masala", "Oppo Mobiles",
  "Chandra Hyundai", "MCR Textiles", "Isha Yoga Group", "Avalon Technologies",
  "Peps Industries", "IndBank", "Bull Agro", "Standard Group", "Kongu Nadu Engineering",
  "Sree Ganapathy Silks", "Vijay Gems", "Saranya Spinning Mills"
];

const ClientSection = () => {
  return (
    <section id="clients" className="py-24 bg-gray-50 overflow-hidden">
      <div className="landing-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-[#1A202C] mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-gray-600 font-medium">
            Join 365+ organizations that rely on Deeproots Technologies every day.
          </p>
        </div>

        {/* Client Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {clients.map((client, index) => (
            <div 
              key={index} 
              className="bg-white px-6 py-8 rounded-2xl border border-gray-100 flex items-center justify-center text-center hover:shadow-lg transition-all duration-300 group"
            >
              <span className="text-gray-400 font-black text-lg group-hover:text-[#0067FF] transition-colors">
                {client.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-20 p-12 bg-white rounded-[40px] border border-gray-100 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h3 className="text-3xl font-extrabold text-[#1A202C] mb-6">
                Ready to transform your HR operations?
              </h3>
              <p className="text-gray-600 text-lg mb-8">
                Our experts are ready to show you how our "Trusted Payroll and HRMS Software" 
                can save your valuable time and improve efficiency.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Payslips</span>
                  <span className="text-3xl font-black text-[#0067FF]">12,00,000+</span>
                </div>
                <div className="w-px h-12 bg-gray-100 hidden md:block"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Organizations</span>
                  <span className="text-3xl font-black text-[#0067FF]">365+</span>
                </div>
                <div className="w-px h-12 bg-gray-100 hidden md:block"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Support</span>
                  <span className="text-3xl font-black text-[#0067FF]">24/7</span>
                </div>
              </div>
            </div>
            <button className="btn-zoho py-5 px-10 text-lg shadow-xl shadow-blue-200">
              Schedule Free Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientSection;
