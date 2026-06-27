"use client";

import React, { useState, useEffect, useRef } from 'react';

const AnimatedNavLink = ({ href, children, isScrolled }) => {
  const defaultTextColor = isScrolled ? 'text-slate-600' : 'text-gray-200';
  const hoverTextColor = isScrolled ? 'text-blue-600' : 'text-white';
  const textSizeClass = 'text-sm font-medium';

  return (
    <a href={href} className={`group relative inline-flex overflow-hidden h-5 items-center whitespace-nowrap ${textSizeClass}`}>
      <div className="flex flex-col transition-transform duration-400 ease-out transform group-hover:-translate-y-1/2">
        <span className={`transition-colors duration-300 ${defaultTextColor}`}>{children}</span>
        <span className={`transition-colors duration-300 ${hoverTextColor}`}>{children}</span>
      </div>
    </a>
  );
};

export function Navbar({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const shapeTimeoutRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    setIsSignedIn(!!localStorage.getItem('token'));
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const logoColor = isScrolled ? "#0A1628" : "white";
  const logoElement = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="flex-shrink-0">
      <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#1E6FD9,#0EA5E9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
      </div>
      <div>
        <span style={{ fontWeight: 800, fontSize: 16, color: logoColor, letterSpacing: "-0.02em", transition: "color 0.3s", whiteSpace: "nowrap" }}>ExportEase</span>
      </div>
    </div>
  );

  const navLinksData = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
  ];

  const loginBtnClasses = isScrolled 
    ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-blue-600"
    : "border-white/30 bg-white/10 text-white hover:bg-white/20";

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setIsSignedIn(false);
    window.dispatchEvent(new Event('authChange'));
  };

  const loginButtonElement = isSignedIn ? (
    <button onClick={handleSignOut} className={`px-4 py-2 sm:px-3 text-xs sm:text-sm border font-medium rounded-full transition-colors duration-300 w-full sm:w-auto shadow-sm whitespace-nowrap ${loginBtnClasses}`}>
      Sign Out
    </button>
  ) : (
    <button onClick={() => onNavigate && onNavigate("login")} className={`px-4 py-2 sm:px-3 text-xs sm:text-sm border font-medium rounded-full transition-colors duration-300 w-full sm:w-auto shadow-sm whitespace-nowrap ${loginBtnClasses}`}>
      Sign In
    </button>
  );

  const signupButtonElement = isSignedIn ? (
    <div className="relative group w-full sm:w-auto flex-shrink-0">
       <button onClick={() => onNavigate && onNavigate("dashboard")} className="relative z-10 px-4 py-2 sm:px-3 text-xs sm:text-sm font-semibold text-white bg-[#1E6FD9] rounded-full hover:bg-blue-700 transition-all duration-200 w-full sm:w-auto shadow-sm whitespace-nowrap">
         Dashboard
       </button>
    </div>
  ) : (
    <div className="relative group w-full sm:w-auto flex-shrink-0">
       <div className="absolute inset-0 -m-2 rounded-full
                     hidden sm:block
                     bg-blue-100
                     opacity-40 filter blur-lg pointer-events-none
                     transition-all duration-300 ease-out
                     group-hover:opacity-60 group-hover:blur-xl group-hover:-m-3"></div>
       <button onClick={() => onNavigate && onNavigate("signup")} className="relative z-10 px-4 py-2 sm:px-3 text-xs sm:text-sm font-semibold text-white bg-[#1E6FD9] rounded-full hover:bg-blue-700 transition-all duration-200 w-full sm:w-auto shadow-sm whitespace-nowrap">
         Get Started
       </button>
    </div>
  );

  const headerBgClass = isScrolled
    ? "border-slate-200 bg-white/70 shadow-md"
    : "border-white/20 bg-white/10 shadow-lg shadow-black/5";

  return (
    <header className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-20
                       flex flex-col items-center
                       pl-6 pr-6 py-3 backdrop-blur-md
                       ${headerShapeClass}
                       border ${headerBgClass}
                       w-[calc(100%-2rem)] sm:w-auto
                       transition-all duration-300 ease-in-out`}>

      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        <div className="flex items-center">
           {logoElement}
        </div>

        <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
          {navLinksData.map((link) => (
            <AnimatedNavLink key={link.href} href={link.href} isScrolled={isScrolled}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          {loginButtonElement}
          {signupButtonElement}
        </div>

        <button className={`sm:hidden flex items-center justify-center w-8 h-8 focus:outline-none transition-colors duration-300 ${isScrolled ? "text-slate-600" : "text-white"}`} onClick={toggleMenu} aria-label={isOpen ? 'Close Menu' : 'Open Menu'}>
          {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          )}
        </button>
      </div>

      <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                       ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
        <nav className="flex flex-col items-center space-y-4 text-base w-full">
          {navLinksData.map((link) => (
            <a key={link.href} href={link.href} className={`font-medium transition-colors duration-300 w-full text-center ${isScrolled ? 'text-slate-600 hover:text-blue-600' : 'text-gray-200 hover:text-white'}`}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-col items-center space-y-4 mt-4 w-full">
          {loginButtonElement}
          {signupButtonElement}
        </div>
      </div>
    </header>
  );
}
