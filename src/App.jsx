import { useState, useEffect, useRef } from "react";

const RAW_BASE = "https://raw.githubusercontent.com/Hamza-Nkhumbwa/floods/main/";
const GEOJSON_URL = "https://raw.githubusercontent.com/hamzankhumbwa01-maker/Spatial_Link/e012fd8d830494773c16127b50c6c2bc8ccae662/studyarea.geojson";

const maps = [
  {
    id: "dem",
    title: "Digital Elevation Model",
    category: "Terrain",
    icon: "🏔",
    images: [{ label: null, file: "dem.png" }],
    description:
      "The Digital Elevation Model (DEM) for the Shire Basin captures vertical relief across the study area using SRTM 30m resolution data. Red tones indicate the lowest elevations close to sea level — precisely the zones where floodwaters accumulate. Deep green represents highland terrain above 300m. The Lower Shire valley floor, where Chikwawa District sits, appears predominantly in warm reds and oranges, confirming its inherent topographic vulnerability to inundation.",
    weight: "22%",
    ahp: 0.22,
    color: "#e07b39",
  },
  {
    id: "population",
    title: "Population Distribution",
    category: "Exposure",
    icon: "👥",
    images: [{ label: null, file: "population.png" }],
    description:
      "Population distribution was derived from WorldPop 100m gridded estimates (2020). Dense clusters shown in red mark the most heavily populated areas — predominantly along road corridors and near the Shire River. Illovo and surrounding communities represent significant population concentrations at elevations that fall within the highest flood susceptibility zones, meaning thousands of residents are directly exposed to flood risk without natural terrain protection.",
    weight: "40% (vulnerability)",
    ahp: 0.4,
    color: "#c0392b",
  },
  {
    id: "rainfall",
    title: "Rainfall Distribution",
    category: "Hydrology",
    icon: "🌧",
    images: [{ label: null, file: "rainfall.png" }],
    description:
      "Accumulated rainfall was computed from CHIRPS daily data across the January–April 2026 rainy season. Deep blue zones received the highest cumulative totals exceeding 600mm, while light blue areas received moderate rainfall of 100–300mm. The spatial pattern reveals orographic enhancement over the escarpment zones and concentrated delivery across the central basin floor — a direct driver of the March–April 2026 flooding event that displaced thousands of Chikwawa residents.",
    weight: "15%",
    ahp: 0.15,
    color: "#2980b9",
  },
  {
    id: "slope",
    title: "Slope Analysis",
    category: "Terrain",
    icon: "📐",
    images: [{ label: null, file: "slope.png" }],
    description:
      "Slope was derived from the SRTM DEM and expressed in degrees. Flat areas (0–2°) receive the highest hazard class (5) since water stagnates rather than drains. The Shire floodplain dominates with near-zero slopes, meaning runoff cannot escape — any rainfall surplus remains ponded. Steeper escarpment areas (>15°) are assigned lower hazard scores, though they contribute overland flow that feeds downstream flooding in the valley below.",
    weight: "12%",
    ahp: 0.12,
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
      "The Soil Water Index (SWI) quantifies near-surface soil saturation using Sentinel-1 SAR backscatter (VV polarisation), normalised to a 0–1 scale. In February, values were moderate across the basin as soils began absorbing early-season rains. By April, deep blue dominates — soils had reached near-saturation, meaning any additional rainfall had nowhere to infiltrate and converted almost entirely to surface runoff, dramatically amplifying flood peaks.",
    weight: "10%",
    ahp: 0.10,
    color: "#16a085",
  },
  {
    id: "ndmi",
    title: "Normalized Difference Moisture Index",
    category: "Vegetation",
    icon: "🌿",
    images: [
      { label: "February 2026", file: "Normalized Difference Vegetation index Feb2026.png" },
      { label: "April 2026", file: "Normalized Difference Vegetation index mar2026.png" },
    ],
    description:
      "NDMI is calculated from Sentinel-2 bands B8 (NIR) and B11 (SWIR) as (B8−B11)/(B8+B11). Green tones indicate vegetation with high moisture content and healthy canopy closure — these areas intercept rainfall and slow runoff. Red and brown tones indicate bare soil or drought-stressed vegetation that provides no infiltration buffering. The February-to-April transition shows a marked greening as heavy rains promoted vegetation recovery, yet the underlying soil saturation paradoxically increased flood risk.",
    weight: "10%",
    ahp: 0.10,
    color: "#27ae60",
  },
  {
    id: "ndvi",
    title: "Normalized Difference Vegetation Index",
    category: "Vegetation",
    icon: "🌱",
    images: [
      { label: "February 2026", file: "ndvifeb.png" },
      { label: "April 2026", file: "ndviapril.png" },
    ],
    description:
      "NDVI captures plant canopy density and vigour across the study period. Low NDVI values in February (dry vegetation, agricultural fallow) transitioned to higher values in April following the main rainfall period. Densely vegetated riparian corridors along the Shire appear consistently high, providing some natural flood buffering. However, large stretches of the floodplain remain as low-cover agricultural land that offers minimal interception capacity during extreme rainfall events.",
    weight: "—",
    ahp: null,
    color: "#229954",
  },
  {
    id: "susceptibility",
    title: "Flood Susceptibility",
    category: "Risk Output",
    icon: "⚠️",
    images: [{ label: null, file: "Flood Susceptibility.png" }],
    description:
      "Flood susceptibility was derived using the Analytic Hierarchy Process (AHP), integrating elevation (22%), rainfall (15%), flow accumulation (18%), river proximity (13%), NDMI (10%), soil moisture (10%) and slope (12%). Red zones represent the highest susceptibility — these are low-lying, flat areas close to river channels with saturated soils and high rainfall. The Illovo sugar estate corridor and surrounding communities emerge as the most susceptible zone, consistent with the March–April 2026 flooding event.",
    weight: "60% (risk model)",
    ahp: 0.6,
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
      "The final flood risk map combines susceptibility (60%) with social vulnerability (40%), where vulnerability integrates population density, land cover, building density and road proximity. Red and deep orange zones represent areas where high physical hazard coincides with dense human settlement — the worst-case scenario. Communities around Illovo and along the Shire floodplain emerge with the highest composite risk scores, meaning these populations face both the greatest likelihood of flooding and the greatest potential for harm.",
    weight: "Final output",
    ahp: null,
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
      "The temporal profile of soil moisture index from February through April 2026 reveals a clear progressive saturation trend. Initial values were moderate in early February as the rainy season established. The index rose sharply following intense rainfall events in late February and March, peaked in late March coinciding with the major flooding episode, then showed slight recovery as rainfall intensity diminished in April. This trajectory confirms the role of antecedent soil moisture in amplifying flood generation.",
    weight: "—",
    ahp: null,
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

function NavBar({ active, setActive }) {
  const [open, setOpen] = useState(false);
  const sections = ["Overview", "Maps", "Methodology", "Conclusion"];
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(10,20,40,0.97)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(59,130,246,0.2)",
      padding: "0 2rem",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      minHeight: "64px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg,#3b82f6,#1e3a8a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>💧</div>
        <div>
          <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Lower Shire
          </div>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Flood Risk Assessment 2026
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "4px" }}>
        {sections.map(s => (
          <button key={s} onClick={() => setActive(s)}
            style={{
              background: active === s ? "rgba(59,130,246,0.2)" : "transparent",
              border: active === s ? "1px solid rgba(59,130,246,0.5)" : "1px solid transparent",
              color: active === s ? "#93c5fd" : "#94a3b8",
              padding: "6px 14px", borderRadius: 6, cursor: "pointer",
              fontSize: 13, fontWeight: 500, transition: "all 0.2s",
            }}
          >{s}</button>
        ))}
      </div>
    </nav>
  );
}

function HeroSection({ setActive }) {
  return (
    <section style={{
      background: "linear-gradient(180deg,#0a1628 0%,#0f1e3d 60%,#0a1628 100%)",
      minHeight: "92vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "4rem 2rem", textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#3b82f6 1px,transparent 1px),linear-gradient(90deg,#3b82f6 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      {/* Glow orb */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        width: 600, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse,rgba(30,58,138,0.4) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", maxWidth: 780 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 20, padding: "4px 16px", marginBottom: "1.5rem",
          fontSize: 12, color: "#fca5a5", letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }} />
          Chikwawa District — March/April 2026 Flood Event
        </div>
        <h1 style={{
          fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800,
          color: "#e2e8f0", lineHeight: 1.1, marginBottom: "1.5rem",
          letterSpacing: "-0.02em",
        }}>
          Lower Shire Valley<br />
          <span style={{ color: "#3b82f6" }}>Flood Risk Assessment</span>
        </h1>
        <p style={{
          fontSize: 17, color: "#94a3b8", lineHeight: 1.8,
          maxWidth: 620, margin: "0 auto 2.5rem",
        }}>
          A multi-criteria spatial analysis of flood susceptibility and community risk for the Shire Basin, Malawi, integrating terrain, hydrology, soil moisture, rainfall and population exposure through the Analytic Hierarchy Process.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setActive("Maps")} style={{
            background: "#1d4ed8", border: "none", color: "#fff",
            padding: "12px 28px", borderRadius: 8, cursor: "pointer",
            fontSize: 14, fontWeight: 600, letterSpacing: "0.02em",
          }}>View Analysis Maps →</button>
          <button onClick={() => setActive("Methodology")} style={{
            background: "transparent", border: "1px solid rgba(100,116,139,0.5)",
            color: "#94a3b8", padding: "12px 28px", borderRadius: 8,
            cursor: "pointer", fontSize: 14, fontWeight: 500,
          }}>AHP Methodology</button>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px",
          marginTop: "3.5rem", background: "rgba(59,130,246,0.15)",
          borderRadius: 12, overflow: "hidden", border: "1px solid rgba(59,130,246,0.2)",
        }}>
          {[
            { v: "7", l: "Data Layers" },
            { v: "10", l: "Analysis Maps" },
            { v: "AHP", l: "Weight Method" },
            { v: "5", l: "Risk Classes" },
          ].map(({ v, l }) => (
            <div key={l} style={{ padding: "1.25rem", background: "rgba(10,20,40,0.6)", textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#60a5fa" }}>{v}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, letterSpacing: "0.05em" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </section>
  );
}

function MapCard({ map }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [loaded, setLoaded] = useState({});
  const url = RAW_BASE + encodeURIComponent(map.images[imgIdx].file);

  return (
    <div style={{
      background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.15)",
      borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      {/* Image area */}
      <div style={{ position: "relative", background: "#060e1c", minHeight: 240 }}>
        {!loaded[imgIdx] && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#334155", fontSize: 13,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗺</div>
              Loading map…
            </div>
          </div>
        )}
        <img
          src={url}
          alt={map.title}
          onLoad={() => setLoaded(p => ({ ...p, [imgIdx]: true }))}
          onError={e => { e.target.style.opacity = 0.2; }}
          style={{
            width: "100%", display: "block",
            opacity: loaded[imgIdx] ? 1 : 0,
            transition: "opacity 0.4s",
          }}
        />
        {/* Category badge */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "rgba(10,20,40,0.85)", border: "1px solid rgba(59,130,246,0.3)",
          borderRadius: 20, padding: "3px 10px", fontSize: 11,
          color: "#93c5fd", letterSpacing: "0.06em",
        }}>{map.category}</div>
        {/* Multi-image toggle */}
        {map.images.length > 1 && (
          <div style={{
            position: "absolute", bottom: 12, left: 0, right: 0,
            display: "flex", gap: 6, justifyContent: "center",
          }}>
            {map.images.map((img, i) => (
              <button key={i} onClick={() => { setImgIdx(i); setLoaded({}); }}
                style={{
                  background: i === imgIdx ? "#3b82f6" : "rgba(10,20,40,0.8)",
                  border: "1px solid rgba(59,130,246,0.4)",
                  color: i === imgIdx ? "#fff" : "#94a3b8",
                  borderRadius: 20, padding: "3px 12px",
                  cursor: "pointer", fontSize: 11, fontWeight: 500,
                }}>
                {img.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Content */}
      <div style={{ padding: "1.25rem 1.4rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <h3 style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            {map.icon} {map.title}
          </h3>
          {map.weight && (
            <span style={{
              background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
              color: "#93c5fd", borderRadius: 20, padding: "2px 10px",
              fontSize: 11, whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0,
            }}>{map.weight}</span>
          )}
        </div>
        <p style={{ color: "#94a3b8", fontSize: 13.5, lineHeight: 1.75, margin: 0, flex: 1 }}>
          {map.description}
        </p>
        {map.highlight && (
          <div style={{
            marginTop: 12, padding: "8px 12px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8, fontSize: 12, color: "#fca5a5",
          }}>
            ⚠ High-priority output — direct policy relevance
          </div>
        )}
      </div>
    </div>
  );
}

function MapsSection() {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Terrain", "Hydrology", "Soil Moisture", "Vegetation", "Exposure", "Risk Output", "Temporal Analysis"];
  const filtered = filter === "All" ? maps : maps.filter(m => m.category === filter);

  return (
    <section style={{ background: "#080f1e", padding: "4rem 2rem", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ color: "#3b82f6", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Spatial Analysis
          </div>
          <h2 style={{ color: "#e2e8f0", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, margin: "0 0 1rem", letterSpacing: "-0.02em" }}>
            Thematic Maps
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, maxWidth: 560, lineHeight: 1.7, margin: "0 0 1.5rem" }}>
            Ten analysis layers spanning terrain, hydrology, vegetation health and community exposure, combining to produce a compound flood risk surface for the Lower Shire Valley.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                style={{
                  background: filter === c ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.04)",
                  border: filter === c ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  color: filter === c ? "#93c5fd" : "#64748b",
                  borderRadius: 20, padding: "5px 14px",
                  cursor: "pointer", fontSize: 12, fontWeight: 500, transition: "all 0.2s",
                }}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))",
          gap: "1.25rem",
        }}>
          {filtered.map(m => <MapCard key={m.id} map={m} />)}
        </div>
      </div>
    </section>
  );
}

function MethodologySection() {
  return (
    <section style={{ background: "#060c18", padding: "4rem 2rem", minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ color: "#3b82f6", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Analytical Framework
        </div>
        <h2 style={{ color: "#e2e8f0", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
          Analytic Hierarchy Process
        </h2>
        <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.75, marginBottom: "2.5rem", maxWidth: 640 }}>
          Factor weights were derived through pairwise comparison of seven hazard parameters using Saaty's AHP. Each factor was reclassified to a 1–5 scale before weighted summation to produce the flood susceptibility surface.
        </p>

        {/* Weight chart */}
        <div style={{
          background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 14, padding: "1.75rem", marginBottom: "2rem",
        }}>
          <h3 style={{ color: "#93c5fd", fontSize: 14, fontWeight: 600, marginTop: 0, marginBottom: "1.25rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Criterion Weights — Flood Susceptibility
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {ahpMatrix.map((row) => (
              <div key={row.factor}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 500 }}>{row.factor}</span>
                  <span style={{ color: "#3b82f6", fontSize: 13, fontWeight: 700 }}>{(row.weight * 100).toFixed(0)}%</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    background: `linear-gradient(90deg,#1d4ed8,#3b82f6)`,
                    width: `${row.weight * 100 / 0.22 * 100}%`,
                    transition: "width 1s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: "1.25rem", padding: "10px 14px",
            background: "rgba(59,130,246,0.07)", borderRadius: 8,
            fontSize: 12, color: "#64748b", lineHeight: 1.6,
          }}>
            Consistency Ratio (CR) verified within acceptable threshold (&lt;0.10), confirming matrix coherence. Total weight sum = 1.00.
          </div>
        </div>

        {/* Model formula */}
        <div style={{
          background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 14, padding: "1.75rem", marginBottom: "2rem",
        }}>
          <h3 style={{ color: "#93c5fd", fontSize: 14, fontWeight: 600, marginTop: 0, marginBottom: "1.25rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Flood Risk Model
          </h3>
          <div style={{
            background: "#060c18", borderRadius: 10, padding: "1.25rem",
            fontFamily: "monospace", fontSize: 13, color: "#7dd3fc", lineHeight: 1.9,
            border: "1px solid rgba(59,130,246,0.1)",
          }}>
            <span style={{ color: "#64748b" }}>{"// Susceptibility"}</span><br />
            Susceptibility = Elev(0.22) + Flow(0.18) + Rain(0.15) + River(0.13)<br />
            {"                   + Slope(0.12) + NDMI(0.10) + SMI(0.10)"}<br />
            <br />
            <span style={{ color: "#64748b" }}>{"// Vulnerability"}</span><br />
            Vulnerability = Pop(0.40) + Building(0.25) + LULC(0.20) + Road(0.15)<br />
            <br />
            <span style={{ color: "#64748b" }}>{"// Final Risk"}</span><br />
            <span style={{ color: "#f87171" }}>Risk = Susceptibility(0.60) + Vulnerability(0.40)</span>
          </div>
        </div>

        {/* Data sources */}
        <div style={{
          background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 14, padding: "1.75rem",
        }}>
          <h3 style={{ color: "#93c5fd", fontSize: 14, fontWeight: 600, marginTop: 0, marginBottom: "1.25rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Data Sources
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
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
                borderRadius: 8, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>{d.icon}</span>
                <div>
                  <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 500 }}>{d.src}</div>
                  <div style={{ color: "#475569", fontSize: 11 }}>{d.layer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewSection({ setActive }) {
  return (
    <section style={{ background: "#080f1e", padding: "4rem 2rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ color: "#3b82f6", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Study Context
        </div>
        <h2 style={{ color: "#e2e8f0", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
          The 2026 Chikwawa Flooding
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginTop: "2rem" }}>
          <div>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.85, marginTop: 0 }}>
              In March and April 2026, Chikwawa District in southern Malawi experienced severe flooding driven by prolonged above-normal rainfall across the Shire Basin catchment. The Lower Shire River — already flowing at high levels following an exceptional rainy season — overtopped its banks, inundating thousands of hectares of agricultural land, settlements, and infrastructure.
            </p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.85 }}>
              This analysis was conducted to understand the spatial distribution of flood risk and identify the communities facing the greatest combined threat from both the physical hazard and their social vulnerability. The Illovo sugar estate corridor and adjacent smallholder areas emerged as the highest-risk zones in the study area.
            </p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.85, marginBottom: 0 }}>
              Using Google Earth Engine and a multi-criteria AHP framework, seven physical parameters were combined with population and infrastructure exposure data to produce a compound flood risk surface at 30m resolution.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { label: "Study Area", value: "Chikwawa District, Lower Shire", icon: "📍" },
              { label: "Analysis Period", value: "February – April 2026", icon: "📅" },
              { label: "Satellite Data", value: "Sentinel-1, Sentinel-2, SRTM, CHIRPS", icon: "🛰" },
              { label: "Spatial Resolution", value: "30 metre pixels", icon: "🔍" },
              { label: "Risk Classes", value: "1 (Low) to 5 (Very High)", icon: "⚠️" },
              { label: "Weighting Method", value: "Analytic Hierarchy Process (AHP)", icon: "⚖️" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.12)",
                borderRadius: 10, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                  <div style={{ color: "#cbd5e1", fontSize: 14, fontWeight: 500, marginTop: 2 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: "2.5rem", textAlign: "center" }}>
          <button onClick={() => setActive("Maps")} style={{
            background: "#1d4ed8", border: "none", color: "#fff",
            padding: "12px 32px", borderRadius: 8, cursor: "pointer",
            fontSize: 14, fontWeight: 600,
          }}>Explore All Maps →</button>
        </div>
      </div>
    </section>
  );
}

function ConclusionSection() {
  return (
    <section style={{ background: "#060c18", padding: "4rem 2rem" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ color: "#3b82f6", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Findings & Recommendations
        </div>
        <h2 style={{ color: "#e2e8f0", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, margin: "0 0 2rem", letterSpacing: "-0.02em" }}>
          Conclusion
        </h2>

        {[
          {
            title: "High-risk zone clearly defined",
            body: "The compound flood risk analysis consistently identifies the Illovo corridor and adjacent Shire floodplain as the zone of greatest combined hazard and vulnerability. These areas sit at elevations below 100m, within 300m of major river channels, with slope values under 2°, and contain substantial population and built infrastructure. All seven AHP factors converge to assign maximum or near-maximum scores here.",
            icon: "🎯",
          },
          {
            title: "Soil saturation amplified the 2026 event",
            body: "The temporal analysis of Soil Water Index confirms that by late March 2026, soils across the basin had reached near-complete saturation. This condition transformed even moderate rainfall events into significant flood-generating episodes — the rainfall that would ordinarily have infiltrated converted almost entirely to surface runoff, driving the river levels that ultimately breached protective embankments near Chikwawa Town.",
            icon: "💧",
          },
          {
            title: "AHP methodology proves fit for purpose",
            body: "The Analytic Hierarchy Process provided a structured, defensible framework for combining incommensurable physical parameters. Elevation received the highest weight (22%) consistent with its dominant control on inundation potential. The consistency ratio for the pairwise comparison matrix was verified within the 0.10 threshold, confirming internal logical coherence across all factor comparisons.",
            icon: "⚖️",
          },
          {
            title: "Recommendations for risk reduction",
            body: "Priority interventions should focus on: (1) Early warning systems tied to SAR-derived soil moisture thresholds — an SWI exceeding 0.7 across the basin should trigger evacuation preparedness; (2) Flood-resilient resettlement planning for the highest-risk red zones around Illovo; (3) Maintaining and restoring riparian vegetation to buffer peak flows; (4) Infrastructure design (roads, health facilities) that accounts for the 1-in-5-year inundation envelope identified in this study.",
            icon: "🛡",
          },
        ].map(({ title, body, icon }) => (
          <div key={title} style={{
            display: "flex", gap: "1.25rem", marginBottom: "2rem",
            padding: "1.5rem", background: "#0d1b2e",
            border: "1px solid rgba(59,130,246,0.12)", borderRadius: 14,
          }}>
            <div style={{
              fontSize: 24, flexShrink: 0, width: 48, height: 48,
              background: "rgba(59,130,246,0.1)", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{icon}</div>
            <div>
              <h3 style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>{title}</h3>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.8, margin: 0 }}>{body}</p>
            </div>
          </div>
        ))}

        <div style={{
          background: "linear-gradient(135deg,rgba(29,78,216,0.15),rgba(30,58,138,0.1))",
          border: "1px solid rgba(59,130,246,0.25)", borderRadius: 14,
          padding: "1.75rem", marginTop: "1rem",
        }}>
          <div style={{ color: "#93c5fd", fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Study Citation
          </div>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.7, margin: 0, fontFamily: "monospace" }}>
            Nkhumbwa, H. (2026). <em style={{ color: "#94a3b8" }}>Flood Risk Assessment for the Lower Shire Valley, Chikwawa District, Malawi: A Multi-Criteria AHP Approach Using Google Earth Engine and Remote Sensing Data.</em> Shire Basin Flood Study, 2026.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      background: "#040810", borderTop: "1px solid rgba(59,130,246,0.1)",
      padding: "2rem", textAlign: "center",
    }}>
      <div style={{ color: "#1d4ed8", fontSize: 20, marginBottom: 8 }}>💧</div>
      <div style={{ color: "#475569", fontSize: 13 }}>
        Lower Shire Flood Risk Assessment · Chikwawa District, Malawi · 2026
      </div>
      <div style={{ color: "#334155", fontSize: 12, marginTop: 6 }}>
        Spatial analysis conducted using Google Earth Engine · Sentinel-1/2 · CHIRPS · SRTM
      </div>
    </footer>
  );
}

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
