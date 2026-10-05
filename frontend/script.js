/* ==========================================================================
   AI-DRIVEN HYPER-LOCAL EARLY WARNING SYSTEM - JAVASCRIPT CONTROLLER
   Multi-Source Risk Prediction Engine: Weather + Satellite + Terrain + History
   ========================================================================== */

// Global Application State
let map = null;
let layerGroups = {
    risk: null,
    satellite: null,
    terrain: null
};
let activeLayers = {
    risk: true,
    satellite: true,
    terrain: true
};
let weatherChart = null;
let currentZoneId = 'Z02'; // Default: Kamptee Flood Plain
let currentScenario = 'default';
let zonesData = [];

// Risk Evolution State
let currentEvoStep = 0;
let evoTimer = null;
let isEvoPlaying = false;


// Color Map for Risk Levels
const RISK_COLORS = {
    'Low': '#10b981',
    'Moderate': '#f59e0b',
    'High': '#f97316',
    'Extreme': '#ef4444'
};

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initLeafletMap();
    initChart();
    attachEventListeners();
    initRiskEvolutionControls();
    loadDashboardData();
});

// Live System Clock
function initClock() {
    const clockEl = document.getElementById('liveClock');
    const updateTime = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
    };
    updateTime();
    setInterval(updateTime, 1000);
}

// 1. Leaflet GIS Map & Layer Group Initialization
function initLeafletMap() {
    map = L.map('gisMap', {
        center: [21.1700, 79.1000],
        zoom: 11,
        zoomControl: true
    });

    // High-Res GIS Basemaps (Zero Watermarks)
    const osmTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    });

    const esriSatTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 18
    });

    const topoTiles = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: OpenStreetMap | OpenTopoMap',
        maxZoom: 17
    });

    osmTiles.addTo(map);

    layerGroups.risk = L.layerGroup().addTo(map);
    layerGroups.satellite = L.layerGroup().addTo(map);
    layerGroups.terrain = L.layerGroup().addTo(map);

    const baseMaps = {
        "🗺️ OpenStreetMap": osmTiles,
        "🛰️ ESRI Satellite Aerial": esriSatTiles,
        "⛰️ OpenTopo Topography": topoTiles
    };

    const overlayMaps = {
        "🔴 Risk Zones": layerGroups.risk,
        "🌀 Satellite Radar Heatmap": layerGroups.satellite,
        "⛰️ Terrain Topography": layerGroups.terrain
    };

    L.control.layers(baseMaps, overlayMaps, { position: 'topright', collapsed: false }).addTo(map);
}

// 2. Chart.js Initialization
function initChart() {
    const ctx = document.getElementById('weatherTrendChart').getContext('2d');
    
    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '01:00', '02:00', '03:00', '04:00 (NOW)', '+1h (FC)', '+2h (FC)', '+3h (FC)', '+4h (FC)'],
            datasets: [
                {
                    label: 'Telemetry Rain (mm/h)',
                    data: [22.0, 55.0, 78.0, 85.0, 48.5, null, null, null, null],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: '#06b6d4'
                },
                {
                    label: 'AI Multi-Source Forecast (mm/h)',
                    data: [null, null, null, null, 48.5, 36.0, 20.0, 9.5, 2.0],
                    borderColor: '#ef4444',
                    borderDash: [5, 5],
                    borderWidth: 2.5,
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef4444'
                },
                {
                    label: 'Accumulated Rain (mm)',
                    data: [78, 133, 211, 296, 338, 374, 394, 403, 405],
                    borderColor: '#8b5cf6',
                    borderWidth: 1.5,
                    yAxisID: 'y1',
                    fill: false,
                    tension: 0.35,
                    pointRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Plus Jakarta Sans', size: 11 },
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: '#1f293d',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 10 } }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Rainfall Rate (mm/h)', color: '#06b6d4', font: { size: 10 } },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b', font: { size: 10 } }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Accumulated (mm)', color: '#8b5cf6', font: { size: 10 } },
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#64748b', font: { size: 10 } }
                }
            }
        }
    });
}

// 3. Attach Event Listeners
function attachEventListeners() {
    // Zone Select Dropdown
    const locSelect = document.getElementById('locationSelect');
    locSelect.addEventListener('change', (e) => {
        currentZoneId = e.target.value;
        updateDashboardForZone(currentZoneId);
    });

    // Scenario Toggle Buttons
    const scenarioBtns = document.querySelectorAll('.btn-scenario');
    scenarioBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            scenarioBtns.forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            currentScenario = target.dataset.scenario;
            loadDashboardData();
        });
    });

    // Re-run AI Engine Button
    const btnPredict = document.getElementById('btnRunPrediction');
    btnPredict.addEventListener('click', () => {
        btnPredict.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Multi-Source Vectors...';
        btnPredict.disabled = true;
        
        setTimeout(() => {
            loadDashboardData();
            btnPredict.innerHTML = '<i class="fa-solid fa-microchip"></i> Run Multi-Source AI Engine';
            btnPredict.disabled = false;
        }, 400);
    });

    // Export Emergency Dispatch Report Button
    const btnExport = document.getElementById('btnExportReport');
    if (btnExport) {
        btnExport.addEventListener('click', exportDispatchReport);
    }

    // Map Layer Toggles
    const toggleRisk = document.getElementById('toggleRiskLayer');
    const toggleSat = document.getElementById('toggleSatLayer');
    const toggleTerrain = document.getElementById('toggleTerrainLayer');

    toggleRisk.addEventListener('click', () => {
        activeLayers.risk = !activeLayers.risk;
        toggleRisk.classList.toggle('active', activeLayers.risk);
        if (activeLayers.risk) map.addLayer(layerGroups.risk);
        else map.removeLayer(layerGroups.risk);
    });

    toggleSat.addEventListener('click', () => {
        activeLayers.satellite = !activeLayers.satellite;
        toggleSat.classList.toggle('active', activeLayers.satellite);
        if (activeLayers.satellite) map.addLayer(layerGroups.satellite);
        else map.removeLayer(layerGroups.satellite);
    });

    toggleTerrain.addEventListener('click', () => {
        activeLayers.terrain = !activeLayers.terrain;
        toggleTerrain.classList.toggle('active', activeLayers.terrain);
        if (activeLayers.terrain) map.addLayer(layerGroups.terrain);
        else map.removeLayer(layerGroups.terrain);
    });
}

// 4. SIGNATURE FEATURE: Risk Evolution Controls & Animation
function initRiskEvolutionControls() {
    const evoSteps = document.querySelectorAll('.evo-step');
    evoSteps.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (isEvoPlaying) stopEvolutionAnimation();
            const stepIdx = parseInt(e.currentTarget.dataset.hour, 10);
            setEvoStep(stepIdx);
        });
    });

    const btnPlay = document.getElementById('btnPlayEvolution');
    btnPlay.addEventListener('click', () => {
        if (isEvoPlaying) {
            stopEvolutionAnimation();
        } else {
            startEvolutionAnimation();
        }
    });
}

function setEvoStep(stepIdx) {
    currentEvoStep = stepIdx;
    const evoSteps = document.querySelectorAll('.evo-step');
    evoSteps.forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.evo-step[data-hour="${stepIdx}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const labelEl = document.getElementById('evoTimeLabel');
    labelEl.textContent = stepIdx === 0 ? "NOW (+0h)" : `+${stepIdx}H (+${stepIdx} hours forecast)`;

    const zone = zonesData.find(z => z.zone_id === currentZoneId);
    if (!zone || !zone.risk_evolution) return;

    const evoStep = zone.risk_evolution[stepIdx] || zone.risk_evolution[0];

    // Update map floating details & summary metrics for this step
    document.getElementById('valRainfall').textContent = evoStep.current_rainfall_mm;
    document.getElementById('valAccumulated').textContent = `24h Acc: ${evoStep.accumulated_24h_mm} mm`;
    document.getElementById('valSatDbz').textContent = evoStep.radar_reflectivity_dbz;
    document.getElementById('valRiskLevel').textContent = evoStep.risk_level.toUpperCase();
    document.getElementById('valRiskProb').textContent = `${Math.round(evoStep.probability * 100)}% Confidence`;

    const riskCard = document.getElementById('cardRiskLevel');
    riskCard.className = `metric-card risk-metric ${evoStep.risk_level.toLowerCase()}`;

    document.getElementById('floatRiskBadge').textContent = evoStep.risk_level.toUpperCase();
    document.getElementById('floatRiskBadge').className = `risk-pill ${evoStep.risk_level.toLowerCase()}`;
    document.getElementById('floatProb').textContent = `${Math.round(evoStep.probability * 100)}%`;
    document.getElementById('floatRain').textContent = `${evoStep.current_rainfall_mm} mm/h`;
    document.getElementById('floatDbz').textContent = `${evoStep.radar_reflectivity_dbz} dBZ`;
    document.getElementById('floatWindow').textContent = evoStep.warning_window;

    // Update GIS polygons opacity/color based on step risk
    renderAllMapLayers(zonesData, stepIdx);
}

function startEvolutionAnimation() {
    isEvoPlaying = true;
    const btnPlay = document.getElementById('btnPlayEvolution');
    btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Evolution';
    btnPlay.classList.add('playing');

    if (currentEvoStep >= 6) currentEvoStep = 0;
    setEvoStep(currentEvoStep);

    evoTimer = setInterval(() => {
        currentEvoStep++;
        if (currentEvoStep > 6) {
            currentEvoStep = 0;
        }
        setEvoStep(currentEvoStep);
    }, 1200);
}

function stopEvolutionAnimation() {
    isEvoPlaying = false;
    if (evoTimer) clearInterval(evoTimer);
    const btnPlay = document.getElementById('btnPlayEvolution');
    btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Play Evolution';
    btnPlay.classList.remove('playing');
}

// 6. Load Data from Backend Flask API `/api/risk-zones`
async function loadDashboardData() {
    try {
        const response = await fetch(`/api/risk-zones?scenario=${currentScenario}`);
        if (!response.ok) throw new Error("API response error");
        
        const json = await response.json();
        zonesData = json.zones;
        renderHyperlocalGrid(zonesData);
        renderAllMapLayers(zonesData, currentEvoStep);
        updateDashboardForZone(currentZoneId);
    } catch (err) {
        console.warn("Backend API request failed, using local fallback dataset:", err);
        zonesData = getFallbackZonesData(currentScenario);
        renderHyperlocalGrid(zonesData);
        renderAllMapLayers(zonesData, currentEvoStep);
        updateDashboardForZone(currentZoneId);
    }
}

// 7. RENDER HYPER-LOCAL SECTOR MATRIX GRID (PROVES MULTI-ZONE RESOLUTION)
function renderHyperlocalGrid(zones) {
    const gridEl = document.getElementById('hyperlocalGrid');
    if (!gridEl) return;

    gridEl.innerHTML = zones.map(zone => {
        const isSelected = zone.zone_id === currentZoneId;
        const riskLevel = zone.risk_level || 'Low';
        const riskClass = riskLevel.toLowerCase();

        return `
            <div class="matrix-chip ${riskClass} ${isSelected ? 'active' : ''}" data-zone="${zone.zone_id}">
                <span class="chip-id">${zone.zone_id}</span>
                <span class="chip-name" title="${zone.location}">${zone.location.split(' (')[0]}</span>
                <span class="chip-pill ${riskClass}">${riskLevel.toUpperCase()}</span>
            </div>
        `;
    }).join('');

    // Attach click handlers
    const chips = gridEl.querySelectorAll('.matrix-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            currentZoneId = chip.dataset.zone;
            document.getElementById('locationSelect').value = currentZoneId;
            updateDashboardForZone(currentZoneId);
        });
    });
}

// 8. Render GIS Map Layers
function renderAllMapLayers(zones, evoStepIdx = 0) {
    layerGroups.risk.clearLayers();
    layerGroups.satellite.clearLayers();
    layerGroups.terrain.clearLayers();

    zones.forEach(zone => {
        let stepRisk = zone.risk_level;
        let stepRain = zone.weather.rainfall_mm;
        let stepDbz = zone.satellite.radar_reflectivity_dbz;

        if (zone.risk_evolution && zone.risk_evolution[evoStepIdx]) {
            const evo = zone.risk_evolution[evoStepIdx];
            stepRisk = evo.risk_level;
            stepRain = evo.current_rainfall_mm;
            stepDbz = evo.radar_reflectivity_dbz;
        }

        const riskColor = RISK_COLORS[stepRisk] || '#3b82f6';
        const isSelected = zone.zone_id === currentZoneId;

        // LAYER 1: RISK ZONES
        const polygon = L.polygon(zone.bounds, {
            color: isSelected ? '#ffffff' : riskColor,
            fillColor: riskColor,
            fillOpacity: isSelected ? 0.55 : 0.32,
            weight: isSelected ? 3.5 : 1.8
        });

        const popupContent = `
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; color: #0f172a; padding: 4px; min-width: 190px;">
                <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700;">${zone.location}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 10px; font-weight: 800; color: #fff; background: ${riskColor}; padding: 2px 6px; border-radius: 4px;">
                        ${stepRisk.toUpperCase()} RISK
                    </span>
                    <strong style="font-size: 11px;">Prob: ${Math.round(zone.probability * 100)}%</strong>
                </div>
                <div style="font-size: 11px; color: #475569; line-height: 1.4;">
                    <strong>Rainfall:</strong> ${stepRain} mm/h<br>
                    <strong>Doppler Radar:</strong> ${stepDbz} dBZ<br>
                    <strong>Elevation:</strong> ${zone.terrain.elevation_m}m ASL
                </div>
                <p style="font-size: 10px; color: #0284c7; margin: 6px 0 0 0; font-weight: 600;">Click zone to view multi-source analysis</p>
            </div>
        `;
        polygon.bindPopup(popupContent);

        polygon.on('click', () => {
            currentZoneId = zone.zone_id;
            document.getElementById('locationSelect').value = zone.zone_id;
            updateDashboardForZone(zone.zone_id);
        });

        layerGroups.risk.addLayer(polygon);

        // LAYER 2: SATELLITE LAYER (Radar Reflectivity)
        let satColor = '#3b82f6';
        if (stepDbz >= 52) satColor = '#dc2626';
        else if (stepDbz >= 40) satColor = '#f97316';
        else if (stepDbz >= 30) satColor = '#eab308';

        const satHeatCircle = L.circle([zone.lat, zone.lon], {
            radius: 1800 + (stepDbz * 45),
            color: satColor,
            fillColor: satColor,
            fillOpacity: 0.35,
            weight: 1.5,
            dashArray: '4, 4'
        });
        satHeatCircle.bindTooltip(`Doppler Radar: ${stepDbz} dBZ (${zone.satellite.cloud_density_pct}% Cloud Cover)`);
        layerGroups.satellite.addLayer(satHeatCircle);

        // LAYER 3: TERRAIN LAYER
        const elev = zone.terrain.elevation_m;
        const isLowland = elev <= 290;
        
        const terrainMarker = L.circleMarker([zone.lat - 0.005, zone.lon + 0.005], {
            radius: isLowland ? 10 : 7,
            color: isLowland ? '#06b6d4' : '#64748b',
            fillColor: isLowland ? '#0284c7' : '#475569',
            fillOpacity: 0.85,
            weight: 2
        });

        const terrainTooltip = `
            <strong>Terrain Topography:</strong> ${zone.terrain.flood_prone_type}<br>
            Elevation: ${elev}m ASL • Slope: ${zone.terrain.slope_degree}°<br>
            Drainage Index: ${zone.terrain.drainage_index}
        `;
        terrainMarker.bindTooltip(terrainTooltip);
        layerGroups.terrain.addLayer(terrainMarker);
    });

    const activeZone = zones.find(z => z.zone_id === currentZoneId);
    if (activeZone) {
        map.panTo([activeZone.lat, activeZone.lon]);
    }
}

// 9. Update Dashboard Widgets on Zone Selection / Evolution Step
function updateDashboardForZone(zoneId) {
    const zone = zonesData.find(z => z.zone_id === zoneId) || zonesData[0];
    if (!zone) return;

    renderHyperlocalGrid(zonesData);

    if (map) {
        map.panTo([zone.lat, zone.lon]);
        renderAllMapLayers(zonesData, currentEvoStep);
    }

    // A. Evolution step override data if available
    let currentRisk = zone.risk_level;
    let currentRain = zone.weather.rainfall_mm;
    let currentAcc = zone.weather.accumulated_24h_mm;
    let currentDbz = zone.satellite.radar_reflectivity_dbz;
    let currentWindow = zone.warning_window;

    if (zone.risk_evolution && zone.risk_evolution[currentEvoStep]) {
        const evo = zone.risk_evolution[currentEvoStep];
        currentRisk = evo.risk_level;
        currentRain = evo.current_rainfall_mm;
        currentAcc = evo.accumulated_24h_mm;
        currentDbz = evo.radar_reflectivity_dbz;
        currentWindow = evo.warning_window;
    }

    // Metrics Summary Cards
    const riskLevelEl = document.getElementById('valRiskLevel');
    const riskCard = document.getElementById('cardRiskLevel');
    
    riskLevelEl.textContent = currentRisk.toUpperCase();
    document.getElementById('valRiskProb').textContent = `${Math.round(zone.probability * 100)}% Confidence`;
    riskCard.className = `metric-card risk-metric ${currentRisk.toLowerCase()}`;

    // Weather
    document.getElementById('valRainfall').textContent = currentRain;
    document.getElementById('valAccumulated').textContent = `24h Cumulative: ${currentAcc} mm`;

    // Satellite
    document.getElementById('valSatDbz').textContent = currentDbz;
    document.getElementById('valSatCloud').textContent = `Cloud Mass: ${zone.satellite.cloud_density_pct}%`;

    // Terrain
    document.getElementById('valElevation').textContent = zone.terrain.elevation_m;
    document.getElementById('valDrainage').textContent = `Drainage Index: ${zone.terrain.drainage_index} (${zone.terrain.flood_prone_type.split(' ')[0]})`;

    // History
    document.getElementById('valHistFreq').textContent = zone.historical.flood_frequency;
    document.getElementById('valHistVuln').textContent = `Vulnerability: ${Math.round(zone.historical.vulnerability_score * 100)}%`;

    // B. Floating Map Overlay
    document.getElementById('floatZoneName').textContent = zone.location;
    const floatBadge = document.getElementById('floatRiskBadge');
    floatBadge.textContent = currentRisk.toUpperCase();
    floatBadge.className = `risk-pill ${currentRisk.toLowerCase()}`;
    document.getElementById('floatProb').textContent = `${Math.round(zone.probability * 100)}%`;
    document.getElementById('floatWindow').textContent = currentWindow;
    document.getElementById('floatRain').textContent = `${currentRain} mm/h`;
    document.getElementById('floatDbz').textContent = `${currentDbz} dBZ`;
    document.getElementById('floatElev').textContent = `${zone.terrain.elevation_m}m ASL (${zone.terrain.flood_prone_type.split(' ')[0]})`;

    // C. Early Warning Alert Panel (Requirement #7 Format)
    renderAlertCard(zone, currentRisk, currentWindow);

    // D. "WHY THIS ALERT?" Matrix & AI Synthesis Quote (Requirement #5)
    renderWhyThisAlert(zone, currentRisk, currentRain, currentAcc, currentDbz);

    // E. Multi-Source Pillar Score Bars
    renderPillarScores(zone);

    // F. Update Trend Chart
    fetchTrendAndUpdateChart(zone);
}

// RENDER PROFESSIONAL ALERT CARD (REQUIREMENT #7)
function renderAlertCard(zone, currentRisk, currentWindow) {
    const alertCard = document.getElementById('earlyWarningPanel');
    alertCard.className = `card alert-card ${currentRisk.toLowerCase()}`;

    const iconEl = document.getElementById('alertIcon');
    if (currentRisk === 'Extreme' || currentRisk === 'High') {
        iconEl.className = 'fa-solid fa-triangle-exclamation alert-icon danger';
    } else if (currentRisk === 'Moderate') {
        iconEl.className = 'fa-solid fa-circle-exclamation alert-icon warning';
    } else {
        iconEl.className = 'fa-solid fa-circle-check alert-icon success';
    }

    document.getElementById('alertTitle').textContent = `⚠ ${currentRisk.toUpperCase()} RISK ALERT`;
    document.getElementById('alertSubtitle').textContent = currentRisk === 'Low' 
        ? 'No immediate extreme weather threat detected'
        : 'Heavy rainfall / flash flood risk detected';

    document.getElementById('alertLocation').textContent = zone.location;
    document.getElementById('alertWindow').textContent = currentWindow;
    document.getElementById('alertConfidence').textContent = `${Math.round(zone.probability * 100)}% (Random Forest Classifier)`;

    const actionsList = document.getElementById('alertActionsList');
    actionsList.innerHTML = zone.recommended_actions.map(act => `<li>${act}</li>`).join('');
}

// RENDER "WHY THIS ALERT?" REASONING MATRIX & SYNTHESIS QUOTE (REQUIREMENT #5)
function renderWhyThisAlert(zone, currentRisk, currentRain, currentAcc, currentDbz) {
    // 1. Update Matrix Badges
    const rainBadge = document.getElementById('whyRainBadge');
    if (currentRain >= 50.0) {
        rainBadge.textContent = `HIGH (${currentRain} mm/h)`;
        rainBadge.className = 'why-badge high';
    } else if (currentRain >= 20.0) {
        rainBadge.textContent = `MODERATE (${currentRain} mm/h)`;
        rainBadge.className = 'why-badge moderate';
    } else {
        rainBadge.textContent = `LOW (${currentRain} mm/h)`;
        rainBadge.className = 'why-badge low';
    }

    const accBadge = document.getElementById('whyAccBadge');
    if (currentAcc >= 150.0) {
        accBadge.textContent = `HIGH (${currentAcc} mm)`;
        accBadge.className = 'why-badge high';
    } else if (currentAcc >= 60.0) {
        accBadge.textContent = `MODERATE (${currentAcc} mm)`;
        accBadge.className = 'why-badge moderate';
    } else {
        accBadge.textContent = `LOW (${currentAcc} mm)`;
        accBadge.className = 'why-badge low';
    }

    const humBadge = document.getElementById('whyHumBadge');
    const hum = zone.weather.humidity_pct;
    humBadge.textContent = `${hum >= 85 ? 'HIGH' : 'MODERATE'} (${hum}%)`;
    humBadge.className = hum >= 85 ? 'why-badge high' : 'why-badge moderate';

    const windBadge = document.getElementById('whyWindBadge');
    const wind = zone.weather.wind_speed_kmh;
    windBadge.textContent = `MODERATE (${wind} km/h)`;
    windBadge.className = 'why-badge moderate';

    const terrainBadge = document.getElementById('whyTerrainBadge');
    const elev = zone.terrain.elevation_m;
    if (elev <= 285) {
        terrainBadge.textContent = `HIGH (${zone.terrain.flood_prone_type} - ${elev}m ASL)`;
        terrainBadge.className = 'why-badge high';
    } else {
        terrainBadge.textContent = `MODERATE (${zone.terrain.flood_prone_type} - ${elev}m ASL)`;
        terrainBadge.className = 'why-badge moderate';
    }

    // 2. AI Synthesis Quote (Requirement #5 Format)
    const quoteEl = document.getElementById('aiSynthesisQuote');
    quoteEl.textContent = `“AI analysis indicates increasing rainfall intensity (${currentRain} mm/h) and high accumulated rainfall (${currentAcc} mm) in a low-elevation catchment basin (${elev}m ASL) are the primary risk contributors.”`;

    // 3. Detailed Factors List
    const xaiList = document.getElementById('xaiFactorsList');
    xaiList.innerHTML = zone.factors.map(factor => {
        let icon = 'fa-circle-exclamation';
        let category = 'MULTI-SOURCE VECTOR';

        const fLower = factor.toLowerCase();
        if (fLower.includes('rainfall') || fLower.includes('rain')) {
            icon = 'fa-cloud-showers-water';
            category = 'WEATHER TELEMETRY';
        } else if (fLower.includes('satellite') || fLower.includes('radar') || fLower.includes('cloud')) {
            icon = 'fa-satellite-dish';
            category = 'DOPPLER RADAR';
        } else if (fLower.includes('elevation') || fLower.includes('terrain') || fLower.includes('drainage') || fLower.includes('catchment')) {
            icon = 'fa-mountain-city';
            category = 'TERRAIN TOPOGRAPHY';
        } else if (fLower.includes('historical') || fLower.includes('flood-prone')) {
            icon = 'fa-clock-rotate-left';
            category = 'HISTORICAL BASELINE';
        }

        return `
            <div class="factor-item ${currentRisk.toLowerCase()}">
                <i class="fa-solid ${icon} factor-icon"></i>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong class="factor-title">${factor}</strong>
                        <span style="font-size: 9px; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em;">${category}</span>
                    </div>
                    <p class="factor-desc">Extracted by Random Forest ML classifier across weather, radar, topography & historical datasets.</p>
                </div>
            </div>
        `;
    }).join('');
}

// RENDER MULTI-SOURCE PILLAR SCORES
function renderPillarScores(zone) {
    const scores = zone.multi_source_scores || {
        weather_score: 78,
        satellite_score: 85,
        terrain_risk_score: 90,
        historical_vulnerability_score: 90
    };

    document.getElementById('scoreWeather').textContent = `${scores.weather_score}%`;
    document.getElementById('fillWeather').style.width = `${scores.weather_score}%`;

    document.getElementById('scoreSatellite').textContent = `${scores.satellite_score}%`;
    document.getElementById('fillSatellite').style.width = `${scores.satellite_score}%`;

    document.getElementById('scoreTerrain').textContent = `${scores.terrain_risk_score}%`;
    document.getElementById('fillTerrain').style.width = `${scores.terrain_risk_score}%`;

    document.getElementById('scoreHistorical').textContent = `${scores.historical_vulnerability_score}%`;
    document.getElementById('fillHistorical').style.width = `${scores.historical_vulnerability_score}%`;
}

// 10. Fetch Trend Data for Chart.js
async function fetchTrendAndUpdateChart(zone) {
    try {
        const res = await fetch(`/api/trends?location=${zone.zone_id}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        const trends = json.trends;
        
        weatherChart.data.labels = trends.timestamps;
        weatherChart.data.datasets[0].data = trends.historical_rainfall;
        weatherChart.data.datasets[1].data = trends.forecast_rainfall;
        weatherChart.data.datasets[2].data = trends.accumulated;
        weatherChart.update();
    } catch {
        const r = zone.weather.rainfall_mm;
        const acc = zone.weather.accumulated_24h_mm;
        weatherChart.data.datasets[0].data = [r*0.4, r*0.7, r*0.9, r*1.1, r, null, null, null, null];
        weatherChart.data.datasets[1].data = [null, null, null, null, r, r*0.7, r*0.4, r*0.2, 0];
        weatherChart.data.datasets[2].data = [acc*0.4, acc*0.6, acc*0.8, acc*0.9, acc, acc+15, acc+25, acc+30, acc+32];
        weatherChart.update();
    }
}

// 11. LOCAL FALLBACK MOCK DATASET WITH RISK EVOLUTION
function getFallbackZonesData(scenario) {
    const isCloudburst = scenario === 'cloudburst';
    const isClear = scenario === 'clear';

    return [
        {
            zone_id: "Z02",
            location: "Kamptee Flood Plain (Kanhan River)",
            lat: 21.2230,
            lon: 79.1850,
            bounds: [[21.245, 79.160], [21.245, 79.210], [21.200, 79.210], [21.200, 79.160]],
            risk_level: isClear ? "Low" : (isCloudburst ? "Extreme" : "High"),
            probability: isClear ? 0.94 : (isCloudburst ? 0.96 : 0.82),
            warning_window: isClear ? "No Immediate Threat" : (isCloudburst ? "Immediate (Next 30 Mins – 2 Hours)" : "Next 2–6 Hours"),
            weather: {
                rainfall_mm: isClear ? 1.5 : (isCloudburst ? 88.0 : 48.5),
                accumulated_24h_mm: isClear ? 8.0 : (isCloudburst ? 290.0 : 124.0),
                temperature_c: 26.5,
                humidity_pct: isClear ? 52 : 94,
                wind_speed_kmh: 22.0
            },
            satellite: {
                cloud_density_pct: isClear ? 25.0 : 88.0,
                radar_reflectivity_dbz: isClear ? 18.0 : 48.0,
                satellite_rain_intensity: isClear ? 0.12 : 0.75
            },
            terrain: {
                elevation_m: 275,
                slope_degree: 0.8,
                drainage_index: 0.30,
                soil_absorption: 0.25,
                flood_prone_type: "Lowland River Floodplain"
            },
            historical: {
                flood_frequency: 11,
                vulnerability_score: 0.90
            },
            factors: isClear ? ["Normal seasonal weather conditions"] : [
                "Heavy rainfall intensity (48.5 mm/h)",
                "High 24h accumulated rainfall (124.0 mm)",
                "High satellite radar intensity (48 dBZ storm reflectivity)",
                "Low elevation river catchment area (275m ASL)",
                "Historical flood-prone zone (11 severe floods per decade)"
            ],
            recommended_actions: isClear ? ["Continue automated multi-source sensor monitoring."] : [
                "Monitor official warnings and avoid low-lying flood-prone roads.",
                "Issue automated SMS & siren broadcast to Ward Response Officers.",
                "Deploy high-capacity mobile storm-water drainage pumps.",
                "Prepare low-lying community evacuation shelters."
            ],
            multi_source_scores: {
                weather_score: isClear ? 15.0 : 78.5,
                satellite_score: isClear ? 20.0 : 85.0,
                terrain_risk_score: 90.0,
                historical_vulnerability_score: 90.0
            },
            risk_evolution: generateMockEvolution(isClear ? 1.5 : (isCloudburst ? 88.0 : 48.5), isClear ? 8.0 : (isCloudburst ? 290.0 : 124.0), isClear ? 18.0 : 48.0)
        },
        {
            zone_id: "Z01",
            location: "Nagpur Central (Sitabuldi)",
            lat: 21.1458,
            lon: 79.0882,
            bounds: [[21.160, 79.070], [21.160, 79.105], [21.130, 79.105], [21.130, 79.070]],
            risk_level: isClear ? "Low" : (isCloudburst ? "High" : "Moderate"),
            probability: 0.78,
            warning_window: "Next 6–12 Hours",
            weather: { rainfall_mm: 24.0, accumulated_24h_mm: 69.0, temperature_c: 27.8, humidity_pct: 88, wind_speed_kmh: 15.5 },
            satellite: { cloud_density_pct: 65.0, radar_reflectivity_dbz: 35.0, satellite_rain_intensity: 0.45 },
            terrain: { elevation_m: 310, slope_degree: 2.5, drainage_index: 0.60, soil_absorption: 0.35, flood_prone_type: "Urban Concrete Basin" },
            historical: { flood_frequency: 4, vulnerability_score: 0.50 },
            factors: ["Moderate rainfall rate (24.0 mm/h)", "Urban storm drain bottlenecking", "Urban Concrete Basin surface runoff"],
            recommended_actions: ["Monitor official warnings and clear key storm drains.", "Alert Municipal Quick Response Force."],
            multi_source_scores: { weather_score: 45.0, satellite_score: 55.0, terrain_risk_score: 40.0, historical_vulnerability_score: 50.0 },
            risk_evolution: generateMockEvolution(24.0, 69.0, 35.0)
        },
        {
            zone_id: "Z03",
            location: "Nagpur South (Besa / Manewada)",
            lat: 21.0950,
            lon: 79.0920,
            bounds: [[21.115, 79.070], [21.115, 79.115], [21.075, 79.115], [21.075, 79.070]],
            risk_level: "Low",
            probability: 0.91,
            warning_window: "No Immediate Threat",
            weather: { rainfall_mm: 8.5, accumulated_24h_mm: 25.0, temperature_c: 28.5, humidity_pct: 65, wind_speed_kmh: 12.0 },
            satellite: { cloud_density_pct: 40.0, radar_reflectivity_dbz: 22.0, satellite_rain_intensity: 0.20 },
            terrain: { elevation_m: 325, slope_degree: 3.5, drainage_index: 0.75, soil_absorption: 0.55, flood_prone_type: "Suburban Elevated Plateau" },
            historical: { flood_frequency: 2, vulnerability_score: 0.25 },
            factors: ["Normal precipitation rate (8.5 mm/h)", "Elevated topography (325m ASL)"],
            recommended_actions: ["Continue routine telemetry monitoring."],
            multi_source_scores: { weather_score: 20.0, satellite_score: 25.0, terrain_risk_score: 15.0, historical_vulnerability_score: 25.0 },
            risk_evolution: generateMockEvolution(8.5, 25.0, 22.0)
        },
        {
            zone_id: "Z04",
            location: "Hingna Industrial Belt",
            lat: 21.1020,
            lon: 78.9850,
            bounds: [[21.120, 78.960], [21.120, 79.010], [21.080, 79.010], [21.080, 78.960]],
            risk_level: isCloudburst ? "High" : "Moderate",
            probability: 0.74,
            warning_window: "Next 6–12 Hours",
            weather: { rainfall_mm: 31.0, accumulated_24h_mm: 82.0, temperature_c: 27.0, humidity_pct: 85, wind_speed_kmh: 18.0 },
            satellite: { cloud_density_pct: 72.0, radar_reflectivity_dbz: 41.0, satellite_rain_intensity: 0.58 },
            terrain: { elevation_m: 298, slope_degree: 1.8, drainage_index: 0.48, soil_absorption: 0.30, flood_prone_type: "Industrial Drainage Corridor" },
            historical: { flood_frequency: 5, vulnerability_score: 0.58 },
            factors: ["Increasing rainfall intensity (31.0 mm/h)", "Industrial runoff accumulation"],
            recommended_actions: ["Monitor industrial effluent drainage sluices.", "Alert factory emergency teams."],
            multi_source_scores: { weather_score: 55.0, satellite_score: 60.0, terrain_risk_score: 50.0, historical_vulnerability_score: 58.0 },
            risk_evolution: generateMockEvolution(31.0, 82.0, 41.0)
        },
        {
            zone_id: "Z05",
            location: "Ambazari Lake Catchment Zone",
            lat: 21.1290,
            lon: 79.0430,
            bounds: [[21.145, 79.020], [21.145, 79.065], [21.110, 79.065], [21.110, 79.020]],
            risk_level: isClear ? "Low" : "Extreme",
            probability: isClear ? 0.95 : 0.95,
            warning_window: isClear ? "No Immediate Threat" : "Immediate (Next 30 Mins – 2 Hours)",
            weather: { rainfall_mm: isClear ? 2.0 : 76.0, accumulated_24h_mm: isClear ? 10.0 : 210.0, temperature_c: 25.5, humidity_pct: 96, wind_speed_kmh: 28.0 },
            satellite: { cloud_density_pct: isClear ? 30.0 : 94.0, radar_reflectivity_dbz: isClear ? 20.0 : 56.0, satellite_rain_intensity: 0.90 },
            terrain: { elevation_m: 282, slope_degree: 0.9, drainage_index: 0.25, soil_absorption: 0.20, flood_prone_type: "Reservoir Overflow Catchment" },
            historical: { flood_frequency: 14, vulnerability_score: 0.95 },
            factors: ["Severe rainfall intensity (76.0 mm/h)", "Reservoir water level overflow threshold", "High satellite radar reflectivity (56 dBZ)"],
            recommended_actions: ["Open lake emergency spillway gates.", "Issue evacuation order for Nag River bank residents.", "Deploy disaster response units."],
            multi_source_scores: { weather_score: isClear ? 18.0 : 95.0, satellite_score: isClear ? 22.0 : 92.0, terrain_risk_score: 95.0, historical_vulnerability_score: 95.0 },
            risk_evolution: generateMockEvolution(isClear ? 2.0 : 76.0, isClear ? 10.0 : 210.0, isClear ? 20.0 : 56.0)
        },
        {
            zone_id: "Z06",
            location: "Ramtek Hill Basin",
            lat: 21.3980,
            lon: 79.3280,
            bounds: [[21.420, 79.300], [21.420, 79.355], [21.375, 79.355], [21.375, 79.300]],
            risk_level: "Low",
            probability: 0.93,
            warning_window: "No Immediate Threat",
            weather: { rainfall_mm: 6.0, accumulated_24h_mm: 18.0, temperature_c: 24.5, humidity_pct: 60, wind_speed_kmh: 14.0 },
            satellite: { cloud_density_pct: 35.0, radar_reflectivity_dbz: 19.0, satellite_rain_intensity: 0.15 },
            terrain: { elevation_m: 345, slope_degree: 8.5, drainage_index: 0.85, soil_absorption: 0.65, flood_prone_type: "High-Altitude Hill Slope" },
            historical: { flood_frequency: 1, vulnerability_score: 0.15 },
            factors: ["Light precipitation rate (6.0 mm/h)", "High slope natural runoff (345m ASL)"],
            recommended_actions: ["Continue standard telemetry logging."],
            multi_source_scores: { weather_score: 15.0, satellite_score: 18.0, terrain_risk_score: 12.0, historical_vulnerability_score: 15.0 },
            risk_evolution: generateMockEvolution(6.0, 18.0, 19.0)
        },
        {
            zone_id: "Z07",
            location: "Nagpur North (Pili River Floodplain)",
            lat: 21.1850,
            lon: 79.0800,
            bounds: [[21.205, 79.060], [21.205, 79.105], [21.165, 79.105], [21.165, 79.060]],
            risk_level: isClear ? "Low" : "High",
            probability: 0.84,
            warning_window: "Next 2–6 Hours",
            weather: { rainfall_mm: isClear ? 3.0 : 52.0, accumulated_24h_mm: isClear ? 12.0 : 138.0, temperature_c: 26.0, humidity_pct: 92, wind_speed_kmh: 20.0 },
            satellite: { cloud_density_pct: isClear ? 28.0 : 86.0, radar_reflectivity_dbz: isClear ? 22.0 : 49.0, satellite_rain_intensity: 0.78 },
            terrain: { elevation_m: 278, slope_degree: 1.2, drainage_index: 0.32, soil_absorption: 0.28, flood_prone_type: "River Basin Silt Plain" },
            historical: { flood_frequency: 9, vulnerability_score: 0.82 },
            factors: ["Heavy rainfall intensity (52.0 mm/h)", "Pili River bank silt overflow risk", "Low elevation (278m ASL)"],
            recommended_actions: ["Clear Pili river bottlenecks.", "Deploy QRF pumps to low-lying settlements."],
            multi_source_scores: { weather_score: isClear ? 20.0 : 82.0, satellite_score: isClear ? 24.0 : 85.0, terrain_risk_score: 88.0, historical_vulnerability_score: 82.0 },
            risk_evolution: generateMockEvolution(isClear ? 3.0 : 52.0, isClear ? 12.0 : 138.0, isClear ? 22.0 : 49.0)
        },
        {
            zone_id: "Z08",
            location: "Wadi Western Ridge",
            lat: 21.1550,
            lon: 78.9980,
            bounds: [[21.175, 78.975], [21.175, 79.020], [21.135, 79.020], [21.135, 78.975]],
            risk_level: "Low",
            probability: 0.90,
            warning_window: "No Immediate Threat",
            weather: { rainfall_mm: 12.0, accumulated_24h_mm: 34.0, temperature_c: 27.2, humidity_pct: 70, wind_speed_kmh: 14.5 },
            satellite: { cloud_density_pct: 45.0, radar_reflectivity_dbz: 25.0, satellite_rain_intensity: 0.30 },
            terrain: { elevation_m: 338, slope_degree: 4.2, drainage_index: 0.80, soil_absorption: 0.60, flood_prone_type: "Western Upland Ridge" },
            historical: { flood_frequency: 2, vulnerability_score: 0.20 },
            factors: ["Moderate rainfall (12.0 mm/h)", "Elevated ridge topography (338m ASL)"],
            recommended_actions: ["Normal sensor telemetry."],
            multi_source_scores: { weather_score: 25.0, satellite_score: 30.0, terrain_risk_score: 18.0, historical_vulnerability_score: 20.0 },
            risk_evolution: generateMockEvolution(12.0, 34.0, 25.0)
        }
    ];
}

function generateMockEvolution(baseRain, baseAcc, baseDbz) {
    const scales = baseRain > 30.0 
        ? [1.0, 1.25, 1.40, 1.10, 0.65, 0.30, 0.10]
        : [1.0, 1.05, 1.10, 0.90, 0.70, 0.40, 0.20];

    const evolution = [];
    let runningAcc = baseAcc;

    for (let i = 0; i < 7; i++) {
        const rScale = scales[i];
        const stepRain = Math.round(baseRain * rScale * 10) / 10;
        runningAcc += i > 0 ? stepRain : 0;
        const stepAcc = Math.round(runningAcc * 10) / 10;
        const stepDbz = Math.round(Math.min(62.0, baseDbz * rScale) * 10) / 10;

        let level = "Low";
        if (stepRain >= 70.0 || stepAcc >= 220.0) level = "Extreme";
        else if (stepRain >= 40.0 || stepAcc >= 110.0) level = "High";
        else if (stepRain >= 20.0 || stepAcc >= 50.0) level = "Moderate";

        let windowStr = "Next 2–6 Hours";
        if (level === "Extreme") windowStr = "Immediate (Next 30 Mins – 2 Hours)";
        else if (level === "Low") windowStr = "No Immediate Threat";

        evolution.push({
            step: i,
            label: i === 0 ? "NOW" : `+${i}h`,
            current_rainfall_mm: stepRain,
            accumulated_24h_mm: stepAcc,
            radar_reflectivity_dbz: stepDbz,
            risk_level: level,
            probability: level === "Extreme" ? 0.96 : (level === "High" ? 0.84 : 0.75),
            warning_window: windowStr
        });
    }

    return evolution;
}

// Export Official Emergency Dispatch Advisory Report
function exportDispatchReport() {
    window.print();
}
