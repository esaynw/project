// ================================
// FINAL GitHub Pages–safe JS
// ================================

// Init map
const map = L.map('map').setView([45.508888, -73.561668], 12);

L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '© OpenStreetMap, CARTO'
}).addTo(map);

// Panes
map.createPane("roadsPane");
map.createPane("collisionsPane");
map.createPane("heatPane");

// Layers
let accidentsGeo = null;
let lanesGeo = null;
let accidentsLayer = L.layerGroup().addTo(map);

// Helpers
function normalizeCode(v) {
  if (v == null) return "";
  const s = String(v).trim().toLowerCase();
  if (["nan","none",""].includes(s)) return "";
  return String(parseInt(s));
}

function getWeatherLabel(v){
  const c = normalizeCode(v);
  return {
    "11":"Clear","12":"Partly cloudy","13":"Cloudy","14":"Rain",
    "15":"Snow","16":"Freezing rain","17":"Fog","18":"High winds",
    "19":"Other precip","99":"Other / Unspecified"
  }[c] || "Undefined";
}

function getLightingLabel(v){
  const c = normalizeCode(v);
  return {
    "1":"Daytime – bright",
    "2":"Daytime – semi-obscure",
    "3":"Night – lit",
    "4":"Night – unlit"
  }[c] || "Undefined";
}

function getAccidentType(val){
  if (!val) return "No Injury";
  const s = val.toLowerCase();
  if (s.includes("mortel") || s.includes("grave")) return "Fatal/Hospitalization";
  if (s.includes("léger")) return "Injury";
  return "No Injury";
}

// Load files — MATCHES REPO FILES EXACTLY
async function loadFiles(){

  // Accident data
  const accRes = await fetch("./bikes.geojson");
  if (!accRes.ok) {
    alert("Could not load bikes.geojson");
    return;
  }
  accidentsGeo = await accRes.json();

  // Bike lane network
  const laneRes = await fetch("./reseau_cyclable.json");
  if (!laneRes.ok){
    alert("Could not load reseau_cyclable.json");
    return;
  }
  lanesGeo = await laneRes.json();

  // Draw layers
  drawBikeLanes();
  drawAccidents();
}

loadFiles();

// Draw bike lanes
function drawBikeLanes(){
  L.geoJSON(lanesGeo, {
    pane: "roadsPane",
    style: { color: "#003366", weight: 2 }
  }).addTo(map);
}

// Draw accident points
function drawAccidents(){
  accidentsLayer.clearLayers();

  accidentsGeo.features.forEach(f => {
    const [lon, lat] = f.geometry.coordinates;
    const p = f.properties;

    const marker = L.circleMarker([lat, lon], {
      radius: 4,
      fillColor: "#ff4444",
      color: "#000",
      fillOpacity: 0.85
    }).bindPopup(`
      <b>ID:</b> ${p.NO_SEQ_COLL}<br>
      <b>Accident type:</b> ${getAccidentType(p.GRAVITE)}<br>
      <b>Weather:</b> ${getWeatherLabel(p.CD_COND_METEO)}<br>
      <b>Lighting:</b> ${getLightingLabel(p.CD_ECLRM)}<br>
      <b>Bike Lane:</b> ${p.ON_BIKELANE ? "Yes" : "No"}
    `);

    accidentsLayer.addLayer(marker);
  });
}
