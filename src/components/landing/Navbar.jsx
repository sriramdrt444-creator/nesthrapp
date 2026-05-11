import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Clients', href: '#clients' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="landing-container py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-[#0067FF] rounded-xl flex items-center justify-center text-white font-bold text-xl">
            D
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold text-[#1A202C] leading-none">DEEPROOTS</span>
            <span className="text-[10px] font-bold text-[#0067FF] tracking-widest uppercase">Technologies</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-gray-600 hover:text-[#0067FF] transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-[#1A202C] hover:text-[#0067FF]"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="btn-zoho py-2.5 px-6 rounded-lg text-sm"
          >
            Get Free Demo <ArrowRight size={16} />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-gray-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 py-6 px-6 flex flex-col gap-6 shadow-xl animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-lg font-bold text-gray-800"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-4 text-center font-bold text-gray-800"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="btn-zoho w-full py-4 justify-center"
            >
              Get Free Demo
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
