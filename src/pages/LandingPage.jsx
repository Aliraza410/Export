import React, { useState, useEffect } from "react";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import StatCard from "../components/StatCard.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { MiniBarChart, DonutChart } from "../components/Charts.jsx";
import NotifItem from "../components/NotifItem.jsx";
import StaggerTestimonials from "../components/StaggerTestimonials.jsx";
import HeroSection from "../components/HeroSection.jsx";
import { Feature } from "../components/ui/feature-with-advantages.jsx";
import { Pricing } from "../components/ui/pricing.jsx";
import { Navbar } from "../components/ui/mini-navbar.jsx";
import { MinimalFooter } from "../components/ui/minimal-footer.jsx";
import { ContactCard } from "../components/ui/contact-card.jsx";
import { Mail, Phone, MapPin } from "lucide-react";
import { Input } from "../components/ui/input.jsx";
import { Button } from "../components/ui/button.jsx";
import { Label } from "../components/ui/label.jsx";
import { Textarea } from "../components/ui/textarea.jsx";

const LandingPage = ({ onNavigate }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showContactMsg, setShowContactMsg] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    e.target.reset(); // clear form fields
    setShowContactMsg(true);
    setTimeout(() => {
      setShowContactMsg(false);
    }, 4000);
  };

  const timeline = [
    { phase: "01", title: "Company Setup & Registration", desc: "Register your company, obtain NTN/STRN, join Chamber, and activate PSW." },
    { phase: "02", title: "Buyer Deal Finalization", desc: "Issue proforma invoice, finalize sales contract, handle LC/advance payment." },
    { phase: "03", title: "Logistics & Customs", desc: "Book freight, prepare shipping documents, complete goods declaration." },
    { phase: "04", title: "Dispatch & Delivery", desc: "Issue bill of lading, obtain certificates, submit bank documents." },
  ];

  const testimonials = [
    { name: "Tariq Mahmood", role: "Rice Exporter, Lahore", text: "ExportEase guided me through my very first export to UAE. What seemed impossible became simple with their step-by-step system.", avatar: "TM", stars: 5 },
    { name: "Sadia Farooq", role: "Textile Startup, Faisalabad", text: "The document generator saved us 3 weeks of back-and-forth. All our export documents were ready in hours.", avatar: "SF", stars: 5 },
    { name: "Hassan Raza", role: "Spice Trader, Karachi", text: "Country insights showed me Germany is the best market for our products. Doubled our revenue in 6 months.", avatar: "HR", stars: 5 },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "0",
      yearlyPrice: "0",
      features: [
        "Basic export guidance",
        "Manual document templates",
        "Market insights (Top 5 countries)",
        "Community support",
      ],
      description: "Perfect for individuals exploring the export business.",
      buttonText: "Get Started Free",
      href: "/signup",
      isPopular: false,
    },
    {
      name: "Pro Exporter",
      price: "5000",
      yearlyPrice: "4000",
      features: [
        "Step-by-step company setup",
        "Automated document generation",
        "Full country & market insights",
        "Cost estimator & ROI calculator",
        "Priority email support",
      ],
      description: "Everything you need to manage active exports efficiently.",
      buttonText: "Start 14-Day Free Trial",
      href: "/signup",
      isPopular: true,
    },
    {
      name: "Enterprise",
      price: "0",
      yearlyPrice: "0",
      isCustom: true,
      features: [
        "Unlimited export clients",
        "Custom document branding",
        "Direct logistics integration",
        "Dedicated account manager",
        "API Access",
      ],
      description: "For large agencies managing multiple export clients.",
      buttonText: "Contact Sales",
      href: "/signup",
      isPopular: false,
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#FAFBFF", minHeight: "100vh" }}>
      {/* Navbar */}
      <Navbar onNavigate={onNavigate} />

      {/* Hero */}
      <HeroSection onNavigate={onNavigate} />


      {/* Features */}
      <Feature />

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: "80px 5%", background: "#F8FAFC", borderTop: "1px solid #F1F5F9" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <Badge color="indigo">Step-by-Step</Badge>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#0A1628", margin: "16px 0 20px", letterSpacing: "-0.02em" }}>Your export journey, simplified</h2>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
            {timeline.map((step, i) => (
              <div key={i} onClick={() => setActiveStep(i)} style={{ cursor: "pointer", padding: 24, borderRadius: 16, background: activeStep === i ? "#0A1628" : "white", border: `1px solid ${activeStep === i ? "#1E6FD9" : "#E5E7EB"}`, transition: "all 0.3s", position: "relative" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: activeStep === i ? "rgba(255,255,255,0.1)" : "#F1F5F9", marginBottom: 8 }}>{step.phase}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: activeStep === i ? "white" : "#0A1628", margin: "0 0 8px" }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: activeStep === i ? "#94A3B8" : "#64748B", margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: "80px 5%", background: "#0A1628" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Badge color="amber">Success Stories</Badge>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "white", margin: "16px 0 0", letterSpacing: "-0.02em" }}>Pakistani exporters trust ExportEase</h2>
          </div>
          <StaggerTestimonials />
        </div>
      </section>

      {/* Pricing */}
      <Pricing plans={pricingPlans} />

      {/* Contact Us */}
      <section style={{ padding: "80px 5%", background: "#F1F5F9", borderTop: "1px solid #E2E8F0" }}>
        <div className="mx-auto max-w-5xl">
          <ContactCard
            title="Get in touch"
            description="If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day."
            contactInfo={[
              {
                icon: Mail,
                label: 'Email',
                value: 'info@exportease.pk',
              },
              {
                icon: Phone,
                label: 'Phone',
                value: '+92 312 1234567',
              },
              {
                icon: MapPin,
                label: 'Address',
                value: 'Faisalabad, Pakistan',
                className: 'col-span-2',
              }
            ]}
          >
            <form onSubmit={handleContactSubmit} className="w-full space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input type="text" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input type="email" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Phone</Label>
                <Input type="phone" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Message</Label>
                <Textarea required />
              </div>
              <Button className="w-full" type="submit">
                Submit
              </Button>
              {showContactMsg && (
                <div style={{ padding: "12px", background: "#D1FAE5", color: "#065F46", borderRadius: "8px", fontSize: "14px", textAlign: "center", fontWeight: "500", marginTop: "16px", transition: "all 0.3s" }}>
                  Message sent successfully! We will get back to you soon.
                </div>
              )}
            </form>
          </ContactCard>
        </div>
      </section>
      <MinimalFooter />
    </div>
  );
};

// ─── AUTH PAGES ──────────────────────────────────────────────────────────────
export default LandingPage;
