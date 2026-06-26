import React, { useState } from "react";
const MiniBarChart = ({ data = [30, 40, 20, 50, 70, 40, 60], color = "#1E6FD9" }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, background: color, opacity: 0.15 + (v / max) * 0.85, borderRadius: "3px 3px 0 0", height: `${(v / max) * 100}%`, transition: "height 0.6s ease" }} />
      ))}
    </div>
  );
};

// ─── Donut Chart ─────────────────────────────────────────────────────────────

const DonutChart = ({ segments = [{ value: 60, color: "#1E6FD9" }, { value: 40, color: "#E2E8F0" }], size = 80 }) => {
  const r = 30, cx = 40, cy = 40, circ = 2 * Math.PI * r;
  let offset = 0;
  const total = segments.reduce((a, b) => a + b.value, 0);
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      {segments.map((s, i) => {
        const dash = (s.value / total) * circ;
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="10" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset} style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />;
        offset += dash;
        return el;
      })}
      <circle cx={cx} cy={cy} r={22} fill="white" />
    </svg>
  );
};

// ─── Line Chart ──────────────────────────────────────────────────────────────

const LineChart = ({ data, color = "#1E6FD9", height = 80 }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const containerRef = React.useRef(null);

  const counts = data.map(d => typeof d === 'object' ? d.count : d);
  const max = Math.max(...counts, 4);
  const min = 0;
  const range = max - min || 1;

  const pointsData = data.map((d, i) => {
    const val = typeof d === 'object' ? d.count : d;
    const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
    const y = 100 - ((val - min) / range) * 100;
    return { x, y, item: d, index: i };
  });

  let pathD = "";
  if (pointsData.length > 0) {
    pathD = `M ${pointsData[0].x},${pointsData[0].y}`;
    for (let i = 0; i < pointsData.length - 1; i++) {
      const curr = pointsData[i];
      const next = pointsData[i + 1];
      const cpX = (curr.x + next.x) / 2;
      pathD += ` C ${cpX},${curr.y} ${cpX},${next.y} ${next.x},${next.y}`;
    }
  }

  const fillPath = `${pathD} L 100,100 L 0,100 Z`;
  const colorHex = color.replace("#", "");

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentage = (mouseX / rect.width) * 100;

    let closest = pointsData[0];
    let minDiff = Infinity;
    pointsData.forEach(p => {
      const diff = Math.abs(p.x - percentage);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    });

    setActiveIndex(closest.index);
  };

  const activePoint = activeIndex !== null ? pointsData[activeIndex] : null;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height, marginTop: 10, cursor: "crosshair" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setActiveIndex(null)}
    >
      {activePoint && activePoint.item.count > 0 && (
        <div style={{
          position: "absolute",
          left: `${activePoint.x}%`,
          top: `${activePoint.y}%`,
          transform: "translate(-50%, -115%)",
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(8px)",
          color: "white",
          padding: "10px 14px",
          borderRadius: 8,
          fontSize: 12,
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)",
          pointerEvents: "none",
          zIndex: 10,
          minWidth: 140,
          border: "1px solid rgba(255,255,255,0.1)",
          whiteSpace: "nowrap"
        }}>
          <div style={{ fontWeight: 800, marginBottom: 6, color: "#F8FAFC", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4 }}>
            {activePoint.item.date}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#94A3B8" }}>Calculations:</span>
            <span style={{ fontWeight: 700, color: "#10B981" }}>{activePoint.item.count}</span>
          </div>
          <div style={{ color: "#E2E8F0", fontSize: 11 }}>
            <span style={{ color: "#94A3B8" }}>Products: </span>
            <span style={{ color: "#F1F5F9", fontWeight: 600 }}>
              {activePoint.item.products?.length ? activePoint.item.products.join(', ') : 'None'}
            </span>
          </div>
        </div>
      )}

      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${colorHex}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
          <filter id={`glow-${colorHex}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <line x1="0" y1="25" x2="100" y2="25" stroke="#F1F5F9" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#F1F5F9" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#F1F5F9" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />

        {activePoint && (
          <line x1={activePoint.x} y1="0" x2={activePoint.x} y2="100" stroke="#CBD5E1" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
        )}

        <path d={fillPath} fill={`url(#grad-${colorHex})`} />

        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" filter={`url(#glow-${colorHex})`} style={{ strokeDasharray: "200", strokeDashoffset: "0", animation: "drawLine 1.2s ease-out forwards" }} />

        {activePoint && activePoint.item.count > 0 && (
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r="4"
            fill="white"
            stroke={color}
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            style={{ filter: `drop-shadow(0 0 3px ${color})` }}
          />
        )}
      </svg>
      <style>{`
        @keyframes drawLine {
          from { stroke-dasharray: 0 200; }
          to { stroke-dasharray: 200 0; }
        }
      `}</style>
    </div>
  );
};

export { MiniBarChart, DonutChart, LineChart };
