import React from 'react';
import { MapPin, Phone, Mail, Globe, Send, ArrowUpRight } from 'lucide-react';

const ContactSection = () => {
  return (
    <footer id="contact" className="bg-[#1A202C] text-white pt-24 pb-12">
      <div className="landing-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-24">
          <div>
            <h2 className="text-4xl font-extrabold mb-8">Get in Touch</h2>
            <p className="text-gray-400 text-lg mb-12 max-w-md">
              We are eager to meet you in person and to gain more understanding about your needs and requirements.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#0067FF] flex-shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Head Office</h4>
                  <p className="text-gray-400 leading-relaxed">
                    BLOCK-2, 1/520/A179, C204, COURT YARD,<br />
                    NEAR- DECATLON, NEELAMBUR,<br />
                    COIMBATORE - 641062, TAMILNADU.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#0067FF] flex-shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Call Us</h4>
                  <p className="text-gray-400">
                    Admin: +91 98948 18002<br />
                    Marketing: +91 80983 16468
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#0067FF] flex-shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Email Us</h4>
                  <p className="text-gray-400">
                    info@deeprootstechnologies.com<br />
                    hr@deeprootstechnologies.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-10 rounded-[32px] border border-white/10">
            <h3 className="text-2xl font-bold mb-8">Send a Message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Name</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-[#0067FF] outline-none transition-colors" placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-[#0067FF] outline-none transition-colors" placeholder="Phone number" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email</label>
                <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-[#0067FF] outline-none transition-colors" placeholder="Email address" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Message</label>
                <textarea rows="4" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-[#0067FF] outline-none transition-colors resize-none" placeholder="How can we help you?"></textarea>
              </div>
              <button className="btn-zoho w-full py-5 text-lg">
                Submit Inquiry <Send size={20} />
              </button>
            </form>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0067FF] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <span className="text-sm font-bold text-gray-400">© 2026 Deeproots Technologies. All rights reserved.</span>
          </div>
          
          <div className="flex items-center gap-8">
            <a href="#" className="text-sm font-bold text-gray-500 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm font-bold text-gray-500 hover:text-white transition-colors">Terms of Service</a>
            <a href="http://www.deeprootstechnologies.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-bold text-[#0067FF] hover:underline">
              Official Website <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ContactSection;
