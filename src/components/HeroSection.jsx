import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const HeroSection = ({ onNavigate }) => {
  const [isSignedIn, setIsSignedIn] = React.useState(false);

  React.useEffect(() => {
    setIsSignedIn(!!localStorage.getItem('token'));
    
    const handleAuthChange = () => {
      setIsSignedIn(!!localStorage.getItem('token'));
    };
    
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#0E254A] py-24 lg:py-32">
      {/* Background Depth: Mesh Glows */}
      <div className="pointer-events-none absolute left-0 top-0 -z-10 h-full w-full overflow-hidden">
        {/* Left-side soft emerald glow */}
        <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[120px]" />
        {/* Right-side soft blue glow */}
        <div className="absolute right-0 top-1/2 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/3 rounded-full bg-blue-600/15 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-8 lg:items-center">
          
          {/* Left Column: Text & CTAs */}
          <motion.div 
            className="flex flex-col items-start"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-emerald-400 uppercase">
                Pakistan's #1 Export Guidance Platform
              </span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="mb-6 text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Export from Pakistan.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Without the Confusion.
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="mb-6 max-w-xl text-lg leading-relaxed text-slate-300">
              A complete A–Z export guidance system for Pakistani businesses. Navigate company setup, documentation, customs, logistics, and delivery with intelligent step-by-step guidance.
            </motion.p>

            <motion.div variants={itemVariants} style={{ marginTop: '32px' }} className="mb-14 flex flex-wrap items-center gap-8">
              {isSignedIn ? (
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30"
                >
                  Go to Dashboard
                  <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              ) : (
                <button 
                  onClick={() => onNavigate('signup')}
                  className="group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30"
                >
                  Start Exporting Free
                  <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-x-12 gap-y-8 pb-12 lg:pb-0">
              {[
                { value: "1,200+", label: "Active Exporters" },
                { value: "50+", label: "Countries Covered" },
                { value: "₨0", label: "To Get Started" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column: Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative lg:ml-auto w-full max-w-md"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="relative rounded-2xl border border-white/10 bg-[#18181B] p-6 shadow-2xl shadow-black/60"
            >
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300">Export Progress</h3>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400">
                  ACTIVE
                </span>
              </div>

              {/* Progress Bars */}
              <div className="mb-8 space-y-5">
                {[
                  { label: "Company Registration", pct: 100, color: "bg-emerald-500" },
                  { label: "Documentation", pct: 75, color: "bg-blue-500" },
                  { label: "Customs Clearance", pct: 45, color: "bg-blue-500" },
                  { label: "Logistics", pct: 20, color: "bg-blue-500" }
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between text-xs font-medium">
                      <span className="text-slate-400">{item.label}</span>
                      <span className={item.pct === 100 ? "text-emerald-400" : "text-slate-500"}>{item.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Est. Shipping", value: "PKR 85K" },
                  { label: "Destination", value: "UAE 🇦🇪" },
                  { label: "Documents", value: "8/12" },
                  { label: "Next Step", value: "Form-E" },
                ].map((box) => (
                  <div key={box.label} className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <div className="mb-1 text-[11px] font-medium text-slate-500 uppercase tracking-wide">{box.label}</div>
                    <div className="text-sm font-bold text-white">{box.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Decorative background blur behind card */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 blur-2xl opacity-50"></div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
