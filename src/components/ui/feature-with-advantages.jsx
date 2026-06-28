import React from "react";
import { Check } from "lucide-react";
import Badge from "../Badge.jsx";

function Feature() {
  const features = [
    { title: "Company Setup", desc: "NTN, STRN, Chamber Membership & PSW registration — all guided." },
    { title: "Smart Documents", desc: "Auto-generate invoices, packing lists, and export contracts." },
    { title: "Cost Estimator", desc: "Accurate shipping, customs, and documentation cost forecasts." },
    { title: "Compliance Guard", desc: "Automatic alerts for regulatory changes and requirements." },
  ];

  return (
    <div className="w-full py-20 lg:py-32 bg-white" id="features">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="flex gap-4 flex-col items-start">
          <div>
            <Badge color="blue">Platform Features</Badge>
          </div>
          <div className="flex gap-2 flex-col">
            <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: "#0A1628", margin: "16px 0 12px", letterSpacing: "-0.02em", fontFamily: "system-ui, -apple-system, sans-serif" }}>
              Everything you need to export confidently
            </h2>
            <p style={{ fontSize: 16, color: "#64748B", maxWidth: 520, margin: 0, lineHeight: 1.6 }}>
              From first registration to final delivery — guided, automated, and stress-free.
            </p>
          </div>
          <div className="flex gap-10 pt-12 flex-col w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 items-start lg:grid-cols-3 gap-10">
              {features.map((feature, idx) => (
                <div key={idx} className="flex flex-row gap-5 w-full items-start">
                  <div className="flex-shrink-0 mt-1" style={{ background: "#EFF6FF", padding: "6px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check className="w-5 h-5" style={{ color: "#1E6FD9" }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", margin: "0 0 4px" }}>{feature.title}</p>
                    <p style={{ fontSize: 14, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };
