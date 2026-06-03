import { useState, useEffect, useRef } from "react";

const RAW_BASE = "https://raw.githubusercontent.com/Hamza-Nkhumbwa/floods/main/";

const maps = [
  {
    id: "dem",
    title: "Digital Elevation Model",
    category: "Terrain",
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

const SECTIONS = ["Overview", "Study Area", "Maps", "Methodology", "Conclusion"];

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
        {/* Logo / Animated Earth */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: isMobile ? 10 : 14,
  }}
>
  
  {/* Animated Video Globe */}
  <div
    style={{
      width: isMobile ? 42 : 52,
      height: isMobile ? 42 : 52,
      borderRadius: "50%",
      overflow: "hidden",
      position: "relative",
      border: "2px solid rgba(59,130,246,0.5)",
      boxShadow: "0 0 18px rgba(59,130,246,0.45)",
      flexShrink: 0,
      background: "#020617",
    }}
  >
    <video
      autoPlay
      muted
      loop
      playsInline
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    >
      <source
        src="https://hamza-nkhumbwa.github.io/datasets/earth.mp4"
        type="video/mp4"
      />
    </video>

    {/* Glow Overlay */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to bottom right, rgba(59,130,246,0.15), rgba(14,165,233,0.08))",
      }}
    />
  </div>

  {/* Text */}
  <div style={{ lineHeight: 1.1 }}>
    <div
      style={{
        color: "#f8fafc",
        fontWeight: 800,
        fontSize: isMobile ? 12 : 15,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      Lower Shire
    </div>

    <div
      style={{
        color: "#38bdf8",
        fontSize: isMobile ? 9 : 11,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginTop: 4,
      }}
    >
      Flood Intelligence 2026
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
      backgroundImage: "url('https://hamza-nkhumbwa.github.io/datasets/cyclone-freddy.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      minHeight: isMobile ? "85vh" : "92vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: isMobile ? "3rem 1.25rem" : "4rem 2rem",
      textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      {/* Dark overlay to keep text readable over the image */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg,rgba(10,22,40,0.72) 0%,rgba(15,30,61,0.80) 55%,rgba(10,22,40,0.75) 100%)",
      }} />
      {/* Subtle grid overlay */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "linear-gradient(#3b82f6 1px,transparent 1px),linear-gradient(90deg,#3b82f6 1px,transparent 1px)",
        backgroundSize: isMobile ? "40px 40px" : "60px 60px",
      }} />
      <div style={{
        position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)",
        width: isMobile ? 300 : 600, height: isMobile ? 200 : 400, borderRadius: "50%",
        background: "radial-gradient(ellipse,rgba(30,58,138,0.25) 0%,transparent 70%)",
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
          <button onClick={() => setActive("Study Area")} style={{
            background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.45)",
            color: "#93c5fd", padding: isMobile ? "10px 22px" : "12px 28px",
            borderRadius: 8, cursor: "pointer",
            fontSize: isMobile ? 13 : 14, fontWeight: 500,
          }}>🗺 Study Area</button>
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
    { label: "Study Area", value: "Chikwawa District, Lower Shire"},
    { label: "Analysis Period", value: "February – April 2026"},
    { label: "Satellite Data", value: "Sentinel-1, Sentinel-2, SRTM, CHIRPS"},
    { label: "Spatial Resolution", value: "30 metre pixels"},
    { label: "Risk Classes", value: "1 (Low) to 5 (Very High)"},
    { label: "Weighting Method", value: "Analytic Hierarchy Process (AHP)"},
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

        <div style={{ marginTop: "2rem", textAlign: "center", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setActive("Maps")} style={{
            background: "#1d4ed8", border: "none", color: "#fff",
            padding: isMobile ? "10px 24px" : "12px 32px",
            borderRadius: 8, cursor: "pointer",
            fontSize: isMobile ? 13 : 14, fontWeight: 600,
          }}>Explore All Maps →</button>
          <button onClick={() => setActive("Study Area")} style={{
            background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)",
            color: "#93c5fd", padding: isMobile ? "10px 24px" : "12px 32px",
            borderRadius: 8, cursor: "pointer",
            fontSize: isMobile ? 13 : 14, fontWeight: 500,
          }}>🗺 View Study Area</button>
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

/* ─── Study Area ─── */
function StudyAreaSection() {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeBase, setActiveBase] = useState("hybrid");
  const isMobile = useIsMobile();
  const baseLayers = useRef({});

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const loadLeaflet = () =>
      new Promise((resolve) => {
        if (window.L) { resolve(window.L); return; }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => resolve(window.L);
        document.head.appendChild(script);
      });

    loadLeaflet().then((L) => {
      if (leafletMap.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      });
      leafletMap.current = map;

      // Dedicated basemap pane (lower z-index)
      map.createPane("basemapPane");
      map.getPane("basemapPane").style.zIndex = 200;

      const googleHybrid = L.tileLayer(
        "http://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        { pane: "basemapPane", attribution: "© Google", maxZoom: 20 }
      );
      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { pane: "basemapPane", attribution: "© OpenStreetMap contributors", maxZoom: 19 }
      );

      baseLayers.current = { hybrid: googleHybrid, osm };
      googleHybrid.addTo(map);

      // Scale control
      L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

      // Load study area GeoJSON
      fetch("https://raw.githubusercontent.com/Hamza-Nkhumbwa/floods/main/rr.geojson")
        .then((r) => r.json())
        .then((geojson) => {
          const studyLayer = L.geoJSON(geojson, {
            style: {
              color: "#3b82f6",
              weight: 2.5,
              fillColor: "#3b82f6",
              fillOpacity: 0.12,
              dashArray: null,
            },
            onEachFeature: (feature, layer) => {
              const props = feature.properties || {};
              const name = props.NAME || props.name || props.ADM2_EN || "Study Area";
              layer.bindPopup(
                `<div style="font-family:system-ui,sans-serif;min-width:160px">
                  <div style="font-weight:700;font-size:13px;margin-bottom:4px">📍 ${name}</div>
                  <div style="font-size:11px;color:#555">Lower Shire Valley, Chikwawa District</div>
                  <div style="font-size:10px;color:#888;margin-top:4px">Flood Risk Study Area · 2026</div>
                </div>`,
                { maxWidth: 220 }
              );
              layer.on("mouseover", function () {
                this.setStyle({ fillOpacity: 0.28, weight: 3.5 });
              });
              layer.on("mouseout", function () {
                this.setStyle({ fillOpacity: 0.12, weight: 2.5 });
              });
            },
          }).addTo(map);
          map.fitBounds(studyLayer.getBounds(), { padding: [40, 40] });
          setMapReady(true);
        })
        .catch(() => {
          map.setView([-16.05, 34.8], 9);
          setMapReady(true);
        });
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  const switchBase = (key) => {
    const L = window.L;
    if (!L || !leafletMap.current) return;
    const map = leafletMap.current;
    Object.entries(baseLayers.current).forEach(([k, layer]) => {
      if (k === key) { if (!map.hasLayer(layer)) map.addLayer(layer); }
      else { if (map.hasLayer(layer)) map.removeLayer(layer); }
    });
    setActiveBase(key);
  };

  const stats = [
    {label: "Location", value: "Chikwawa District, Malawi" },
    {label: "River", value: "Lower Shire River" },
    {label: "Resolution", value: "30m SRTM / Sentinel" },
    {label: "Event", value: "March – April 2026" },
    {label: "Coordinates", value: "−16.05°N, 34.80°E" },
    {label: "Hazard", value: "Flood & Inundation" },
  ];

  return (
    <section style={{ background: "#080f1e", padding: isMobile ? "2rem 1rem" : "4rem 2rem", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ color: "#3b82f6", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            Spatial Context
          </div>
          <h2 style={{ color: "#e2e8f0", fontSize: isMobile ? "1.4rem" : "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, margin: "0 0 0.6rem", letterSpacing: "-0.02em" }}>
            Study Area
          </h2>
          <p style={{ color: "#64748b", fontSize: isMobile ? 13 : 15, lineHeight: 1.75, maxWidth: 640, margin: 0 }}>
            The Lower Shire Valley, Chikwawa District — one of Malawi's most flood-prone lowland corridors, sitting at the terminus of the Shire River before it enters Mozambique.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 300px",
          gap: "1.25rem",
          alignItems: "start",
        }}>

          {/* Map column */}
          <div>
            {/* Custom basemap toggle */}
            <div style={{
              display: "flex", gap: 6, marginBottom: 8,
            }}>
              {[
                { key: "hybrid", label: " Google Hybrid" },
                { key: "osm", label: " OpenStreetMap" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => switchBase(key)}
                  style={{
                    background: activeBase === key ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.05)",
                    border: activeBase === key ? "1px solid rgba(59,130,246,0.7)" : "1px solid rgba(255,255,255,0.1)",
                    color: activeBase === key ? "#93c5fd" : "#64748b",
                    borderRadius: 8, padding: "6px 14px",
                    cursor: "pointer", fontSize: 12, fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                >{label}</button>
              ))}
            </div>

            {/* Map box */}
            <div style={{
              borderRadius: 14, overflow: "hidden",
              border: "1px solid rgba(59,130,246,0.25)",
              boxShadow: "0 0 40px rgba(59,130,246,0.1)",
              height: isMobile ? 380 : 520,
              position: "relative",
              background: "#060c18",
            }}>
              {!mapReady && (
                <div style={{
                  position: "absolute", inset: 0, zIndex: 10,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  background: "#060c18", color: "#475569",
                  gap: 10,
                }}>
                  <div style={{ fontSize: 32 }}>🌍</div>
                  <div style={{ fontSize: 13 }}>Loading map…</div>
                </div>
              )}
              <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
            </div>

            {/* Map legend */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 8, padding: "5px 12px" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: "rgba(59,130,246,0.25)", border: "2px solid #3b82f6", flexShrink: 0 }} />
                <span style={{ color: "#94a3b8", fontSize: 12 }}>Study Area Boundary</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 8, padding: "5px 12px" }}>
                <span style={{ fontSize: 13 }}></span>
                <span style={{ color: "#475569", fontSize: 11 }}>Click polygons for details · Scroll to zoom</span>
              </div>
            </div>
          </div>

          {/* Stats sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{
              background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: 12, padding: "1.1rem 1.25rem",
            }}>
              <div style={{ color: "#93c5fd", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.9rem" }}>
                Area Details
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {stats.map(({ icon, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
                      <div style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 500, marginTop: 1 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Context note */}
            <div style={{
              background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)",
              borderRadius: 12, padding: "1rem 1.1rem",
            }}>
              <div style={{ color: "#fca5a5", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
                ⚠ Why This Area?
              </div>
              <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.75, margin: 0 }}>
                Chikwawa District lies in the lowest reach of the Shire valley at elevations below 100m, making it inherently susceptible to riverine flooding. The convergence of low gradient terrain, high population density and seasonal rainfall extremes creates Malawi's most compound flood-risk environment.
              </p>
            </div>

            {/* Quick nav */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                Explore Analysis
              </div>
              {[
                { label: "→ Thematic Maps", section: "Maps" },
                { label: "→ AHP Methodology", section: "Methodology" },
                { label: "→ Findings & Conclusions", section: "Conclusion" },
              ].map(({ label, section }) => (
                <button
                  key={section}
                  // setActive is not in scope here; use window event
                  onClick={() => {
                    // bubble up via custom event
                    window.dispatchEvent(new CustomEvent("navTo", { detail: section }));
                  }}
                  style={{
                    background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)",
                    color: "#93c5fd", borderRadius: 8, padding: "8px 12px",
                    cursor: "pointer", fontSize: 12, fontWeight: 500,
                    textAlign: "left", transition: "all 0.2s",
                  }}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
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
              { src: "USGS SRTM 30m", layer: "Elevation / Slope"},
              { src: "MERIT Hydro v1", layer: "Flow Accumulation"},
              { src: "Copernicus S1 GRD", layer: "Soil Moisture / Flood Extent"},
              { src: "Copernicus S2 SR", layer: "NDMI / NDVI"},
              { src: "CHIRPS Daily", layer: "Rainfall Accumulation"},
              { src: "WorldPop 100m", layer: "Population Distribution"},
              { src: "ESA WorldCover", layer: "Land Use / Land Cover"},
              { src: "WWF HydroSHEDS", layer: "River Network"},
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
      body: "The compound flood risk analysis consistently identifies the Illovo corridor and adjacent Shire floodplain as the zone of greatest combined hazard and vulnerability. These areas sit at elevations below 100m, within 300m of major river channels, with slope values under 2°, and contain substantial population and built infrastructure. All seven AHP factors converge to assign maximum or near-maximum scores here."
    },
    {
      title: "Soil saturation amplified the 2026 event",
      body: "The temporal analysis of Soil Water Index confirms that by late March 2026, soils across the basin had reached near-complete saturation. This condition transformed even moderate rainfall into significant flood-generating episodes — rainfall that would ordinarily infiltrate converted almost entirely to surface runoff, driving the river levels that breached protective embankments near Chikwawa Town.",
    },
    {
      title: "AHP methodology proves fit for purpose",
      body: "The Analytic Hierarchy Process provided a structured, defensible framework for combining incommensurable physical parameters. Elevation received the highest weight (22%) consistent with its dominant control on inundation potential. The consistency ratio was verified within the 0.10 threshold, confirming internal logical coherence.",
    },
    {
      title: "Recommendations for risk reduction",
      body: "Priority interventions: (1) Early warning systems tied to SAR-derived soil moisture thresholds — SWI exceeding 0.7 should trigger evacuation preparedness; (2) Flood-resilient resettlement planning for the highest-risk zones around Illovo; (3) Maintaining riparian vegetation to buffer peak flows; (4) Infrastructure design that accounts for the 1-in-5-year inundation envelope.",
    },
  ];

  return (
    <section style={{
      backgroundImage: "url('https://hamza-nkhumbwa.github.io/datasets/floods.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      position: "relative",
      padding: isMobile ? "2.5rem 1.25rem" : "4rem 2rem",
    }}>
      {/* Dark overlay for readability */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg,rgba(6,12,24,0.88) 0%,rgba(6,12,24,0.82) 50%,rgba(6,12,24,0.92) 100%)",
      }} />
      <div style={{ maxWidth: 820, margin: "0 auto", position: "relative", zIndex: 1 }}>
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
      padding: isMobile ? "2rem 1rem" : "2.5rem 2rem",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
          gap: isMobile ? "1.5rem" : "2rem",
          marginBottom: "1.75rem",
        }}>
          {/* Branding */}
          <div>
            <div style={{ color: "#1d4ed8", fontSize: 22, marginBottom: 8 }}>💧</div>
            <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              Lower Shire Flood Intelligence
            </div>
            <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.6 }}>
              Chikwawa District, Malawi · 2026<br />
              Multi-criteria flood risk mapping via AHP
            </div>
          </div>

          {/* Data */}
          <div>
            <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Data Platforms
            </div>
            {["Google Earth Engine", "Copernicus Open Access Hub", "USGS Earth Explorer", "WorldPop · CHIRPS · HydroSHEDS"].map(d => (
              <div key={d} style={{ color: "#475569", fontSize: 12, marginBottom: 4 }}>{d}</div>
            ))}
          </div>

          {/* Method */}
          <div>
            <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Methodology
            </div>
            {["Analytic Hierarchy Process (AHP)", "Sentinel-1 SAR · SWI", "Sentinel-2 NDMI / NDVI", "SRTM 30m DEM · CHIRPS Daily"].map(d => (
              <div key={d} style={{ color: "#475569", fontSize: 12, marginBottom: 4 }}>{d}</div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(59,130,246,0.08)", paddingTop: "1.25rem", textAlign: "center" }}>
          <div style={{ color: "#334155", fontSize: isMobile ? 10 : 11 }}>
            Lower Shire Flood Risk Assessment · Chikwawa District, Malawi · 2026 · Nkhumbwa, H.
          </div>
          <div style={{ color: "#1e3a5f", fontSize: isMobile ? 9 : 10, marginTop: 4 }}>
            Spatial analysis via Google Earth Engine · Sentinel-1/2 · CHIRPS · SRTM
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Root ─── */
export default function App() {
  const [active, setActive] = useState("Overview");

  useEffect(() => {
    const handler = (e) => setActive(e.detail);
    window.addEventListener("navTo", handler);
    return () => window.removeEventListener("navTo", handler);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080f1e", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <NavBar active={active} setActive={setActive} />
      {active === "Overview" && (
        <>
          <HeroSection setActive={setActive} />
          <OverviewSection setActive={setActive} />
        </>
      )}
      {active === "Study Area" && <StudyAreaSection />}
      {active === "Maps" && <MapsSection />}
      {active === "Methodology" && <MethodologySection />}
      {active === "Conclusion" && <ConclusionSection />}
      <Footer />
    </div>
  );
}
