import { useState, useEffect, useRef } from "react";

const RAW_BASE = "https://raw.githubusercontent.com/Hamza-Nkhumbwa/floods/main/";

const maps = [
  {
    id: "dem",
    title: "Digital Elevation Model",
    category: "Terrain",
    icon: "🏔",
    images: [{ label: null, file: "dem.png" }],
    description:
      "The Digital Elevation Model (DEM) for the Shire Basin captures vertical relief using SRTM 30m resolution data. Red tones indicate the lowest elevations — precisely the zones where floodwaters accumulate. Deep green represents highland terrain above 300m. The Lower Shire valley floor, where Chikwawa District sits, appears in warm reds and oranges, confirming its inherent topographic vulnerability.",
    weight: "22%",
    color: "#e07b39",
  },
  {
    id: "population",
    title: "Population Distribution",
    category: "Exposure",
    icon: "👥",
    images: [{ label: null, file: "population.png" }],
    description:
      "Population distribution derived from WorldPop 100m gridded estimates (2020). Dense clusters in red mark heavily populated areas — predominantly along road corridors and near the Shire River. Illovo and surrounding communities represent significant population concentrations within the highest flood susceptibility zones.",
    weight: "40% (vuln.)",
    color: "#c0392b",
  },
  {
    id: "rainfall",
    title: "Rainfall Distribution",
    category: "Hydrology",
    icon: "🌧",
    images: [{ label: null, file: "rainfall.png" }],
    description:
      "Accumulated rainfall computed from CHIRPS daily data across the January–April 2026 rainy season. Deep blue zones received the highest cumulative totals exceeding 600mm. The spatial pattern reveals orographic enhancement over escarpment zones — a direct driver of the March–April 2026 flooding event.",
    weight: "15%",
    color: "#2980b9",
  },
  {
    id: "slope",
    title: "Slope Analysis",
    category: "Terrain",
    icon: "📐",
    images: [{ label: null, file: "slope.png" }],
    description:
      "Slope derived from the SRTM DEM and expressed in degrees. Flat areas (0–2°) receive the highest hazard class since water stagnates rather than drains. The Shire floodplain dominates with near-zero slopes, meaning any rainfall surplus remains ponded.",
    weight: "12%",
    color: "#8e44ad",
  },
  {
    id: "swi",
    title: "Soil Water Index",
    category: "Soil Moisture",
    icon: "💧",
    images: [
      { label: "February 2026", file: "soil water index feb.png" },
      { label: "April 2026", file: "soil water index mar.png" },
    ],
    description:
      "The Soil Water Index quantifies near-surface soil saturation using Sentinel-1 SAR backscatter, normalised to 0–1. By April, deep blue dominates — soils had reached near-saturation, meaning any additional rainfall converted almost entirely to surface runoff, dramatically amplifying flood peaks.",
    weight: "10%",
    color: "#16a085",
  },
  {
    id: "ndmi",
    title: "Norm. Difference Moisture Index",
    category: "Vegetation",
    icon: "🌿",
    images: [
      { label: "February 2026", file: "Normalized Difference Vegetation index Feb2026.png" },
      { label: "April 2026", file: "Normalized Difference Vegetation index mar2026.png" },
    ],
    description:
      "NDMI calculated from Sentinel-2 bands B8 and B11. Green tones indicate vegetation with high moisture content that intercepts rainfall and slows runoff. Red tones indicate bare soil providing no infiltration buffering. The Feb-to-Apr transition shows marked greening as heavy rains promoted vegetation recovery.",
    weight: "10%",
    color: "#27ae60",
  },
  {
    id: "ndvi",
    title: "Norm. Difference Vegetation Index",
    category: "Vegetation",
    icon: "🌱",
    images: [
      { label: "February 2026", file: "ndvifeb.png" },
      { label: "April 2026", file: "ndviapril.png" },
    ],
    description:
      "NDVI captures plant canopy density across the study period. Low NDVI in February transitioned to higher values in April following the main rainfall period. Densely vegetated riparian corridors along the Shire appear consistently high, providing natural flood buffering.",
    weight: "—",
    color: "#229954",
  },
  {
    id: "susceptibility",
    title: "Flood Susceptibility",
    category: "Risk Output",
    icon: "⚠️",
    images: [{ label: null, file: "Flood Susceptibility.png" }],
    description:
      "Flood susceptibility derived using AHP, integrating elevation (22%), rainfall (15%), flow accumulation (18%), river proximity (13%), NDMI (10%), soil moisture (10%) and slope (12%). Red zones represent highest susceptibility. The Illovo sugar estate corridor emerges as the most susceptible zone, consistent with the March–April 2026 event.",
    weight: "60% (risk)",
    color: "#e74c3c",
    highlight: true,
  },
  {
    id: "risk",
    title: "Flood Risk Map",
    category: "Risk Output",
    icon: "🚨",
    images: [{ label: null, file: "Flood Risk.png" }],
    description:
      "The final flood risk map combines susceptibility (60%) with social vulnerability (40%), integrating population density, land cover, building density and road proximity. Communities around Illovo and along the Shire floodplain emerge with the highest composite risk scores.",
    weight: "Final output",
    color: "#c0392b",
    highlight: true,
  },
  {
    id: "timeseries",
    title: "Soil Moisture Time Series",
    category: "Temporal Analysis",
    icon: "📈",
    images: [{ label: null, file: "time series.png" }],
    description:
      "The temporal profile of soil moisture from February through April 2026 reveals progressive saturation. Values rose sharply following intense rainfall in late February and March, peaked in late March coinciding with the major flooding episode, then showed slight recovery as rainfall diminished in April.",
    weight: "—",
    color: "#2471a3",
  },
];

const ahpMatrix = [
  { factor: "Elevation", weight: 0.22, rank: 1 },
  { factor: "Flow Accumulation", weight: 0.18, rank: 2 },
  { factor: "Rainfall", weight: 0.15, rank: 3 },
  { factor: "River Proximity", weight: 0.13, rank: 4 },
  { factor: "Slope", weight: 0.12, rank: 5 },
  { factor: "NDMI", weight: 0.10, rank: 6 },
  { factor: "Soil Moisture", weight: 0.10, rank: 7 },
];

const SECTIONS = ["Overview", "Maps", "Methodology", "Conclusion"];

/* ─── Responsive hook ─── */
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

/* ─── NavBar ─── */
function NavBar({ active, setActive }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 200,
      background: "rgba(8,15,30,0.97)", backdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(59,130,246,0.18)",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "0 1rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        minHeight: isMobile ? 56 : 64,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: "50%",
            background: "linear-gradient(135deg,#3b82f6,#1e3a8a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: isMobile ? 15 : 18, flexShrink: 0,
          }}>💧</div>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: isMobile ? 11 : 13, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Lower Shire
            </div>
            <div style={{ color: "#64748b", fontSize: isMobile ? 9 : 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Flood Risk 2026
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 4 }}>
            {SECTIONS.map(s => (
              <button key={s} onClick={() => setActive(s)} style={{
                background: active === s ? "rgba(59,130,246,0.2)" : "transparent",
                border: active === s ? "1px solid rgba(59,130,246,0.5)" : "1px solid transparent",
                color: active === s ? "#93c5fd" : "#94a3b8",
                padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                fontSize: 13, fontWeight: 500, transition: "all 0.2s",
              }}>{s}</button>
            ))}
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button onClick={() => setMenuOpen(o => !o)} style={{
            background: "transparent", border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 6, color: "#93c5fd", padding: "6px 10px",
            cursor: "pointer", fontSize: 16, lineHeight: 1,
          }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        )}
      </div>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div style={{
          background: "rgba(8,15,30,0.99)",
          borderTop: "1px solid rgba(59,130,246,0.12)",
          padding: "0.5rem 1rem 0.75rem",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {SECTIONS.map(s => (
            <button key={s} onClick={() => { setActive(s); setMenuOpen(false); }} style={{
              background: active === s ? "rgba(59,130,246,0.18)" : "transparent",
              border: "none",
              borderLeft: active === s ? "3px solid #3b82f6" : "3px solid transparent",
              color: active === s ? "#93c5fd" : "#94a3b8",
              padding: "9px 14px", borderRadius: "0 6px 6px 0",
              cursor: "pointer", fontSize: 14, fontWeight: 500,
              textAlign: "left", width: "100%",
            }}>{s}</button>
          ))}
        </div>
      )}
    </nav>
  );
}

/* ─── Hero ─── */
function HeroSection({ setActive }) {
  const isMobile = useIsMobile();
  return (
    <section style={{
      background: "linear-gradient(180deg,#0a1628 0%,#0f1e3d 60%,#0a1628 100%)",
      minHeight: isMobile ? "85vh" : "92vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: isMobile ? "3rem 1.25rem" : "4rem 2rem",
      textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#3b82f6 1px,transparent 1px),linear-gradient(90deg,#3b82f6 1px,transparent 1px)",
        backgroundSize: isMobile ? "40px 40px" : "60px 60px",
      }} />
      <div style={{
        position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)",
        width: isMobile ? 300 : 600, height: isMobile ? 200 : 400, borderRadius: "50%",
        background: "radial-gradient(ellipse,rgba(30,58,138,0.4) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", maxWidth: 780, width: "100%" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 20, padding: isMobile ? "3px 12px" : "4px 16px", marginBottom: "1.25rem",
          fontSize: isMobile ? 10 : 12, color: "#fca5a5", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
          Chikwawa District — March/April 2026
        </div>

        <h1 style={{
          fontSize: isMobile ? "1.9rem" : "clamp(2.2rem,5vw,3.8rem)",
          fontWeight: 800, color: "#e2e8f0", lineHeight: 1.15,
          marginBottom: "1.25rem", letterSpacing: "-0.02em",
          margin: "0 0 1.25rem",
        }}>
          Lower Shire Valley<br />
          <span style={{ color: "#3b82f6" }}>Flood Risk Assessment</span>
        </h1>

        <p style={{
          fontSize: isMobile ? 14 : 17, color: "#94a3b8", lineHeight: 1.8,
          maxWidth: 580, margin: "0 auto 2rem",
        }}>
          A multi-criteria spatial analysis of flood susceptibility and community risk for the Shire Basin, Malawi — integrating terrain, hydrology, soil moisture, rainfall and population exposure through the Analytic Hierarchy Process.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setActive("Maps")} style={{
            background: "#1d4ed8", border: "none", color: "#fff",
            padding: isMobile ? "10px 22px" : "12px 28px",
            borderRadius: 8, cursor: "pointer",
            fontSize: isMobile ? 13 : 14, fontWeight: 600,
          }}>View Maps →</button>
          <button onClick={() => setActive("Methodology")} style={{
            background: "transparent", border: "1px solid rgba(100,116,139,0.5)",
            color: "#94a3b8", padding: isMobile ? "10px 22px" : "12px 28px",
            borderRadius: 8, cursor: "pointer",
            fontSize: isMobile ? 13 : 14, fontWeight: 500,
          }}>AHP Methodology</button>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px",
          marginTop: "2.5rem", background: "rgba(59,130,246,0.15)",
          borderRadius: 12, overflow: "hidden", border: "1px solid rgba(59,130,246,0.2)",
        }}>
          {[
            { v: "7", l: "Data Layers" },
            { v: "10", l: "Maps" },
            { v: "AHP", l: "Method" },
            { v: "5", l: "Risk Classes" },
          ].map(({ v, l }) => (
            <div key={l} style={{ padding: isMobile ? "0.9rem 0.5rem" : "1.25rem", background: "rgba(10,20,40,0.6)", textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? "1.2rem" : "1.6rem", fontWeight: 800, color: "#60a5fa" }}>{v}</div>
              <div style={{ fontSize: isMobile ? 10 : 12, color: "#64748b", marginTop: 3, letterSpacing: "0.04em" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Overview ─── */
function OverviewSection({ setActive }) {
  const isMobile = useIsMobile();
  const details = [
    { label: "Study Area", value: "Chikwawa District, Lower Shire", icon: "📍" },
    { label: "Analysis Period", value: "February – April 2026", icon: "📅" },
    { label: "Satellite Data", value: "Sentinel-1, Sentinel-2, SRTM, CHIRPS", icon: "🛰" },
    { label: "Spatial Resolution", value: "30 metre pixels", icon: "🔍" },
    { label: "Risk Classes", value: "1 (Low) to 5 (Very High)", icon: "⚠️" },
    { label: "Weighting Method", value: "Analytic Hierarchy Process (AHP)", icon: "⚖️" },
  ];

  return (
    <section style={{ background: "#080f1e", padding: isMobile ? "2.5rem 1.25rem" : "4rem 2rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ color: "#3b82f6", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          Study Context
        </div>
        <h2 style={{ color: "#e2e8f0", fontSize: isMobile ? "1.4rem" : "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, margin: "0 0 1.5rem", letterSpacing: "-0.02em" }}>
          The 2026 Chikwawa Flooding
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? "1.5rem" : "2.5rem",
        }}>
          <div>
            {[
              "In March and April 2026, Chikwawa District in southern Malawi experienced severe flooding driven by prolonged above-normal rainfall across the Shire Basin catchment. The Lower Shire River overtopped its banks, inundating thousands of hectares of agricultural land, settlements, and infrastructure.",
              "This analysis was conducted to understand the spatial distribution of flood risk and identify communities facing the greatest combined threat from both the physical hazard and their social vulnerability. The Illovo sugar estate corridor emerged as the highest-risk zone.",
              "Using Google Earth Engine and a multi-criteria AHP framework, seven physical parameters were combined with population and infrastructure exposure data to produce a compound flood risk surface at 30m resolution.",
            ].map((p, i) => (
              <p key={i} style={{ color: "#94a3b8", fontSize: isMobile ? 14 : 15, lineHeight: 1.85, marginTop: i === 0 ? 0 : "1rem", marginBottom: 0 }}>
                {p}
              </p>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {details.map(({ label, value, icon }) => (
              <div key={label} style={{
                background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.12)",
                borderRadius: 10, padding: isMobile ? "10px 14px" : "12px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: isMobile ? 18 : 20, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                  <div style={{ color: "#cbd5e1", fontSize: isMobile ? 12 : 13, fontWeight: 500, marginTop: 2 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <button onClick={() => setActive("Maps")} style={{
            background: "#1d4ed8", border: "none", color: "#fff",
            padding: isMobile ? "10px 24px" : "12px 32px",
            borderRadius: 8, cursor: "pointer",
            fontSize: isMobile ? 13 : 14, fontWeight: 600,
          }}>Explore All Maps →</button>
        </div>
      </div>
    </section>
  );
}

/* ─── Map Card ─── */
function MapCard({ map }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [loaded, setLoaded] = useState({});
  const isMobile = useIsMobile();
  const url = RAW_BASE + encodeURIComponent(map.images[imgIdx].file);

  return (
    <div style={{
      background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.15)",
      borderRadius: 12, overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ position: "relative", background: "#060e1c", minHeight: isMobile ? 200 : 240 }}>
        {!loaded[imgIdx] && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#334155", fontSize: 12,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🗺</div>
              Loading…
            </div>
          </div>
        )}
        <img
          src={url}
          alt={map.title}
          onLoad={() => setLoaded(p => ({ ...p, [imgIdx]: true }))}
          onError={e => { e.target.style.opacity = 0.15; }}
          style={{ width: "100%", display: "block", opacity: loaded[imgIdx] ? 1 : 0, transition: "opacity 0.4s" }}
        />
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(8,15,30,0.85)", border: "1px solid rgba(59,130,246,0.3)",
          borderRadius: 20, padding: "2px 9px", fontSize: 10,
          color: "#93c5fd", letterSpacing: "0.05em",
        }}>{map.category}</div>

        {map.images.length > 1 && (
          <div style={{
            position: "absolute", bottom: 10, left: 0, right: 0,
            display: "flex", gap: 5, justifyContent: "center",
          }}>
            {map.images.map((img, i) => (
              <button key={i} onClick={() => { setImgIdx(i); setLoaded({}); }} style={{
                background: i === imgIdx ? "#3b82f6" : "rgba(8,15,30,0.85)",
                border: "1px solid rgba(59,130,246,0.4)",
                color: i === imgIdx ? "#fff" : "#94a3b8",
                borderRadius: 20, padding: "2px 10px",
                cursor: "pointer", fontSize: 10, fontWeight: 500,
              }}>{img.label}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: isMobile ? "1rem 1.1rem" : "1.25rem 1.4rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
          <h3 style={{ color: "#e2e8f0", fontSize: isMobile ? 14 : 15, fontWeight: 700, margin: 0, lineHeight: 1.35 }}>
            {map.icon} {map.title}
          </h3>
          {map.weight && map.weight !== "—" && (
            <span style={{
              background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
              color: "#93c5fd", borderRadius: 20, padding: "2px 9px",
              fontSize: 10, whiteSpace: "nowrap", flexShrink: 0,
            }}>{map.weight}</span>
          )}
        </div>
        <p style={{ color: "#94a3b8", fontSize: isMobile ? 12.5 : 13.5, lineHeight: 1.75, margin: 0, flex: 1 }}>
          {map.description}
        </p>
        {map.highlight && (
          <div style={{
            marginTop: 10, padding: "7px 10px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 7, fontSize: 11, color: "#fca5a5",
          }}>
            ⚠ High-priority output — direct policy relevance
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Maps Section ─── */
function MapsSection() {
  const [filter, setFilter] = useState("All");
  const isMobile = useIsMobile();
  const categories = ["All", "Terrain", "Hydrology", "Soil Moisture", "Vegetation", "Exposure", "Risk Output", "Temporal Analysis"];
  const filtered = filter === "All" ? maps : maps.filter(m => m.category === filter);

  return (
    <section style={{ background: "#080f1e", padding: isMobile ? "2.5rem 1rem" : "4rem 2rem", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ color: "#3b82f6", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            Spatial Analysis
          </div>
          <h2 style={{ color: "#e2e8f0", fontSize: isMobile ? "1.4rem" : "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
            Thematic Maps
          </h2>
          <p style={{ color: "#64748b", fontSize: isMobile ? 13 : 15, maxWidth: 560, lineHeight: 1.7, margin: "0 0 1.25rem" }}>
            Ten analysis layers spanning terrain, hydrology, vegetation health and community exposure, combining to produce a compound flood risk surface for the Lower Shire Valley.
          </p>

          {/* Category filter — horizontal scroll on mobile */}
          <div style={{
            display: "flex", gap: 5, flexWrap: isMobile ? "nowrap" : "wrap",
            overflowX: isMobile ? "auto" : "visible",
            paddingBottom: isMobile ? 4 : 0,
            scrollbarWidth: "none",
          }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                background: filter === c ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.04)",
                border: filter === c ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                color: filter === c ? "#93c5fd" : "#64748b",
                borderRadius: 20, padding: isMobile ? "5px 12px" : "5px 14px",
                cursor: "pointer", fontSize: isMobile ? 11 : 12, fontWeight: 500,
                whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s",
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))",
          gap: isMobile ? "1rem" : "1.25rem",
        }}>
          {filtered.map(m => <MapCard key={m.id} map={m} />)}
        </div>
      </div>
    </section>
  );
}

/* ─── Methodology ─── */
function MethodologySection() {
  const isMobile = useIsMobile();
  return (
    <section style={{ background: "#060c18", padding: isMobile ? "2.5rem 1.25rem" : "4rem 2rem", minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ color: "#3b82f6", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          Analytical Framework
        </div>
        <h2 style={{ color: "#e2e8f0", fontSize: isMobile ? "1.4rem" : "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
          Analytic Hierarchy Process
        </h2>
        <p style={{ color: "#64748b", fontSize: isMobile ? 13 : 15, lineHeight: 1.75, marginBottom: "2rem", maxWidth: 640 }}>
          Factor weights were derived through pairwise comparison of seven hazard parameters using Saaty's AHP. Each factor was reclassified to a 1–5 scale before weighted summation to produce the flood susceptibility surface.
        </p>

        {/* Weight bars */}
        <div style={{
          background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 14, padding: isMobile ? "1.25rem" : "1.75rem", marginBottom: "1.5rem",
        }}>
          <h3 style={{ color: "#93c5fd", fontSize: isMobile ? 12 : 13, fontWeight: 600, marginTop: 0, marginBottom: "1.25rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Criterion Weights — Flood Susceptibility
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {ahpMatrix.map(row => (
              <div key={row.factor}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#cbd5e1", fontSize: isMobile ? 12 : 13, fontWeight: 500 }}>{row.factor}</span>
                  <span style={{ color: "#3b82f6", fontSize: isMobile ? 12 : 13, fontWeight: 700 }}>{(row.weight * 100).toFixed(0)}%</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 7, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    background: "linear-gradient(90deg,#1d4ed8,#3b82f6)",
                    width: `${(row.weight / 0.22) * 100}%`,
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: "1.25rem", padding: "9px 12px",
            background: "rgba(59,130,246,0.07)", borderRadius: 8,
            fontSize: 11, color: "#64748b", lineHeight: 1.6,
          }}>
            Consistency Ratio (CR) verified within acceptable threshold (&lt;0.10). Total weight sum = 1.00.
          </div>
        </div>

        {/* Formula */}
        <div style={{
          background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 14, padding: isMobile ? "1.25rem" : "1.75rem", marginBottom: "1.5rem",
        }}>
          <h3 style={{ color: "#93c5fd", fontSize: isMobile ? 12 : 13, fontWeight: 600, marginTop: 0, marginBottom: "1.25rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Flood Risk Model
          </h3>
          <div style={{
            background: "#060c18", borderRadius: 10,
            padding: isMobile ? "1rem" : "1.25rem",
            fontFamily: "monospace", fontSize: isMobile ? 11 : 12.5,
            color: "#7dd3fc", lineHeight: 2,
            border: "1px solid rgba(59,130,246,0.1)",
            overflowX: "auto",
          }}>
            <span style={{ color: "#64748b" }}>{"// Susceptibility"}</span><br />
            Elev(0.22) + Flow(0.18) + Rain(0.15)<br />
            {"+ River(0.13) + Slope(0.12) + NDMI(0.10) + SMI(0.10)"}<br />
            <br />
            <span style={{ color: "#64748b" }}>{"// Vulnerability"}</span><br />
            Pop(0.40) + Building(0.25) + LULC(0.20) + Road(0.15)<br />
            <br />
            <span style={{ color: "#f87171" }}>Risk = Susceptibility(0.60) + Vulnerability(0.40)</span>
          </div>
        </div>

        {/* Data sources */}
        <div style={{
          background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 14, padding: isMobile ? "1.25rem" : "1.75rem",
        }}>
          <h3 style={{ color: "#93c5fd", fontSize: isMobile ? 12 : 13, fontWeight: 600, marginTop: 0, marginBottom: "1.25rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Data Sources
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(220px,1fr))",
            gap: 8,
          }}>
            {[
              { src: "USGS SRTM 30m", layer: "Elevation / Slope", icon: "🛰" },
              { src: "MERIT Hydro v1", layer: "Flow Accumulation", icon: "🌊" },
              { src: "Copernicus S1 GRD", layer: "Soil Moisture / Flood Extent", icon: "📡" },
              { src: "Copernicus S2 SR", layer: "NDMI / NDVI", icon: "🌿" },
              { src: "CHIRPS Daily", layer: "Rainfall Accumulation", icon: "🌧" },
              { src: "WorldPop 100m", layer: "Population Distribution", icon: "👥" },
              { src: "ESA WorldCover", layer: "Land Use / Land Cover", icon: "🗺" },
              { src: "WWF HydroSHEDS", layer: "River Network", icon: "🏞" },
            ].map(d => (
              <div key={d.src} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8, padding: "9px 12px",
                display: "flex", alignItems: "center", gap: 9,
              }}>
                <span style={{ fontSize: 16 }}>{d.icon}</span>
                <div>
                  <div style={{ color: "#cbd5e1", fontSize: isMobile ? 12 : 13, fontWeight: 500 }}>{d.src}</div>
                  <div style={{ color: "#475569", fontSize: 10 }}>{d.layer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Conclusion ─── */
function ConclusionSection() {
  const isMobile = useIsMobile();
  const findings = [
    {
      title: "High-risk zone clearly defined",
      body: "The compound flood risk analysis consistently identifies the Illovo corridor and adjacent Shire floodplain as the zone of greatest combined hazard and vulnerability. These areas sit at elevations below 100m, within 300m of major river channels, with slope values under 2°, and contain substantial population and built infrastructure. All seven AHP factors converge to assign maximum or near-maximum scores here.",
      icon: "🎯",
    },
    {
      title: "Soil saturation amplified the 2026 event",
      body: "The temporal analysis of Soil Water Index confirms that by late March 2026, soils across the basin had reached near-complete saturation. This condition transformed even moderate rainfall into significant flood-generating episodes — rainfall that would ordinarily infiltrate converted almost entirely to surface runoff, driving the river levels that breached protective embankments near Chikwawa Town.",
      icon: "💧",
    },
    {
      title: "AHP methodology proves fit for purpose",
      body: "The Analytic Hierarchy Process provided a structured, defensible framework for combining incommensurable physical parameters. Elevation received the highest weight (22%) consistent with its dominant control on inundation potential. The consistency ratio was verified within the 0.10 threshold, confirming internal logical coherence.",
      icon: "⚖️",
    },
    {
      title: "Recommendations for risk reduction",
      body: "Priority interventions: (1) Early warning systems tied to SAR-derived soil moisture thresholds — SWI exceeding 0.7 should trigger evacuation preparedness; (2) Flood-resilient resettlement planning for the highest-risk zones around Illovo; (3) Maintaining riparian vegetation to buffer peak flows; (4) Infrastructure design that accounts for the 1-in-5-year inundation envelope.",
      icon: "🛡",
    },
  ];

  return (
    <section style={{ background: "#060c18", padding: isMobile ? "2.5rem 1.25rem" : "4rem 2rem" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ color: "#3b82f6", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          Findings & Recommendations
        </div>
        <h2 style={{ color: "#e2e8f0", fontSize: isMobile ? "1.4rem" : "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, margin: "0 0 1.75rem", letterSpacing: "-0.02em" }}>
          Conclusion
        </h2>

        {findings.map(({ title, body, icon }) => (
          <div key={title} style={{
            display: "flex", gap: isMobile ? "1rem" : "1.25rem", marginBottom: "1.25rem",
            padding: isMobile ? "1.1rem" : "1.5rem",
            background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 12,
          }}>
            <div style={{
              fontSize: 20, flexShrink: 0,
              width: isMobile ? 38 : 46, height: isMobile ? 38 : 46,
              background: "rgba(59,130,246,0.1)", borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{icon}</div>
            <div>
              <h3 style={{ color: "#e2e8f0", fontSize: isMobile ? 14 : 15, fontWeight: 700, margin: "0 0 6px" }}>{title}</h3>
              <p style={{ color: "#94a3b8", fontSize: isMobile ? 12.5 : 14, lineHeight: 1.8, margin: 0 }}>{body}</p>
            </div>
          </div>
        ))}

        <div style={{
          background: "linear-gradient(135deg,rgba(29,78,216,0.15),rgba(30,58,138,0.1))",
          border: "1px solid rgba(59,130,246,0.25)", borderRadius: 12,
          padding: isMobile ? "1.1rem" : "1.75rem", marginTop: "0.5rem",
        }}>
          <div style={{ color: "#93c5fd", fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Study Citation
          </div>
          <p style={{ color: "#64748b", fontSize: isMobile ? 11.5 : 13, lineHeight: 1.7, margin: 0, fontFamily: "monospace" }}>
            Nkhumbwa, H. (2026). <em style={{ color: "#94a3b8" }}>Flood Risk Assessment for the Lower Shire Valley, Chikwawa District, Malawi: A Multi-Criteria AHP Approach Using Google Earth Engine and Remote Sensing Data.</em> Shire Basin Flood Study, 2026.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const isMobile = useIsMobile();
  return (
    <footer style={{
      background: "#040810", borderTop: "1px solid rgba(59,130,246,0.1)",
      padding: isMobile ? "1.5rem 1rem" : "2rem", textAlign: "center",
    }}>
      <div style={{ color: "#1d4ed8", fontSize: 18, marginBottom: 6 }}>💧</div>
      <div style={{ color: "#475569", fontSize: isMobile ? 11 : 13 }}>
        Lower Shire Flood Risk Assessment · Chikwawa District, Malawi · 2026
      </div>
      <div style={{ color: "#334155", fontSize: isMobile ? 10 : 12, marginTop: 5 }}>
        Spatial analysis via Google Earth Engine · Sentinel-1/2 · CHIRPS · SRTM
      </div>
    </footer>
  );
}

/* ─── Root ─── */
export default function App() {
  const [active, setActive] = useState("Overview");
  return (
    <div style={{ minHeight: "100vh", background: "#080f1e", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <NavBar active={active} setActive={setActive} />
      {active === "Overview" && (
        <>
          <HeroSection setActive={setActive} />
          <OverviewSection setActive={setActive} />
        </>
      )}
      {active === "Maps" && <MapsSection />}
      {active === "Methodology" && <MethodologySection />}
      {active === "Conclusion" && <ConclusionSection />}
      <Footer />
    </div>
  );
}
