import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MapPin, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';
import { DEMO_FARM_POINTS, DEMO_MAP_BOUNDS, DEMO_MAP_ZONES, DEMO_PLOT_BOUNDS } from './demoMapData.js';

const width = 720;
const height = 390;
const padding = 42;

function projectCoordinate(latitude, longitude) {
  return {
    x: padding + ((longitude - DEMO_MAP_BOUNDS.west) / (DEMO_MAP_BOUNDS.east - DEMO_MAP_BOUNDS.west)) * (width - 2 * padding),
    y: height - padding - ((latitude - DEMO_MAP_BOUNDS.south) / (DEMO_MAP_BOUNDS.north - DEMO_MAP_BOUNDS.south)) * (height - 2 * padding),
  };
}

function projectDemoCoordinate(latitude, longitude) {
  return {
    x: padding + ((longitude - DEMO_PLOT_BOUNDS.west) / (DEMO_PLOT_BOUNDS.east - DEMO_PLOT_BOUNDS.west)) * (width - 2 * padding),
    y: height - padding - ((latitude - DEMO_PLOT_BOUNDS.south) / (DEMO_PLOT_BOUNDS.north - DEMO_PLOT_BOUNDS.south)) * (height - 2 * padding),
  };
}

function isWithinCalapanMapArea(farm) {
  const latitude = Number(farm.latitude);
  const longitude = Number(farm.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= DEMO_MAP_BOUNDS.south && latitude <= DEMO_MAP_BOUNDS.north
    && longitude >= DEMO_MAP_BOUNDS.west && longitude <= DEMO_MAP_BOUNDS.east;
}

function polygonPoints(coordinates) {
  return coordinates.map(([latitude, longitude]) => {
    const point = projectDemoCoordinate(latitude, longitude);
    return `${point.x},${point.y}`;
  }).join(' ');
}

function farmMarkerColor(farm) {
  if (farm.crop_names && farm.livestock_names) return '#7c3aed';
  if (farm.crop_names) return '#d97706';
  if (farm.livestock_names) return '#2563eb';
  return '#45683b';
}

export default function MapPage() {
  const { user } = useAuth();
  const mapContainer = useRef(null);
  const selectedFarmRef = useRef('');
  const previewMarker = useRef(null);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [pickedLocation, setPickedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);
  const [error, setError] = useState('');
  const [mapError, setMapError] = useState('');
  const [boundaryError, setBoundaryError] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [osmConsent, setOsmConsent] = useState(false);
  const canEditLocations = ['cao_admin', 'cao_staff', 'barangay_personnel'].includes(user.role);
  selectedFarmRef.current = selectedFarmId;

  const loadFarms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/farms');
      const farmRecords = response?.data?.data;
      if (!Array.isArray(farmRecords)) {
        throw new Error('Farm locations could not be loaded because the service returned an invalid response.');
      }
      setFarms(farmRecords);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFarms(); }, [loadFarms]);

  const points = useMemo(() => {
    return farms.filter(isWithinCalapanMapArea).map((farm) => ({
      ...farm,
      ...projectCoordinate(Number(farm.latitude), Number(farm.longitude)),
    }));
  }, [farms]);
  const editableFarms = useMemo(
    () => farms.filter((farm) =>
      (farm.latitude === null || farm.latitude === '' || farm.longitude === null || farm.longitude === '')
        || isWithinCalapanMapArea(farm)),
    [farms],
  );
  const isDemo = farms.length === 0;
  const outsideAreaCount = farms.filter((farm) => farm.latitude !== null && farm.latitude !== '' && farm.longitude !== null && farm.longitude !== '' && !isWithinCalapanMapArea(farm)).length;
  const mapPoints = useMemo(() => isDemo
    ? DEMO_FARM_POINTS.map((farm) => ({ ...farm, ...projectDemoCoordinate(farm.latitude, farm.longitude), isDemo: true }))
    : points, [isDemo, points]);

  useEffect(() => {
    if (!osmConsent || mapPoints.length === 0 || !mapContainer.current) return undefined;
    setMapError('');
    setMapReady(false);
    const map = L.map(mapContainer.current, {
      center: [13.41, 121.17],
      zoom: 12,
      minZoom: 10,
      maxZoom: 18,
      maxBounds: [
        [DEMO_MAP_BOUNDS.south, DEMO_MAP_BOUNDS.west],
        [DEMO_MAP_BOUNDS.north, DEMO_MAP_BOUNDS.east],
      ],
      maxBoundsViscosity: 0.9,
      zoomControl: false,
      scrollWheelZoom: false,
    });
    L.control.zoom({ position: 'topright' }).addTo(map);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      crossOrigin: true,
    });
    tiles.addTo(map);
    const markerGroup = L.markerClusterGroup({ maxClusterRadius: 48 });
    if (isDemo) {
      DEMO_MAP_ZONES.forEach((zone) => L.polygon(zone.coordinates, {
        color: '#638451',
        weight: 2,
        dashArray: '5 5',
        fillColor: '#91ad75',
        fillOpacity: 0.18,
      }).addTo(map).bindTooltip(zone.name));
    }

    const markers = mapPoints.map((farm) => {
      const marker = L.circleMarker([Number(farm.latitude), Number(farm.longitude)], {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: farmMarkerColor(farm),
        fillOpacity: 1,
      });
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = farm.farm_name || `Farm ${farm.id}`;
      const detail = document.createElement('p');
      detail.textContent = farm.isDemo ? 'Illustrative presentation point' : (farm.farmer_name || '');
      const barangay = document.createElement('p');
      barangay.textContent = farm.barangay_name || '';
      popup.append(title, detail, barangay);
      marker.bindPopup(popup);
      marker.bindTooltip(farm.farm_name || `Farm ${farm.id}`);
      markerGroup.addLayer(marker);
      return marker;
    });
    markerGroup.addTo(map);

    const chooseLocation = (event) => {
      if (!canEditLocations || isDemo || !selectedFarmRef.current) return;
      const location = {
        latitude: Number(event.latlng.lat.toFixed(7)),
        longitude: Number(event.latlng.lng.toFixed(7)),
      };
      setPickedLocation(location);
      if (previewMarker.current) previewMarker.current.remove();
      previewMarker.current = L.marker(event.latlng, {
        draggable: true,
        icon: L.divIcon({
          className: 'map-location-preview',
          html: '<span></span>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);
      previewMarker.current.on('dragend', (dragEvent) => {
        const point = dragEvent.target.getLatLng();
        setPickedLocation({
          latitude: Number(point.lat.toFixed(7)),
          longitude: Number(point.lng.toFixed(7)),
        });
      });
    };
    map.on('click', chooseLocation);

    const boundaryUrl = import.meta.env.VITE_BARANGAY_BOUNDARIES_URL;
    let active = true;
    if (boundaryUrl) {
      fetch(boundaryUrl, { headers: { Accept: 'application/geo+json, application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error('Boundary data request failed.');
          return response.json();
        })
        .then((geoJson) => {
          if (!active) return;
          L.geoJSON(geoJson, {
            style: { color: '#285e7a', weight: 2, fillColor: '#5ba6b8', fillOpacity: 0.08 },
            onEachFeature: (feature, layer) => {
              const label = feature.properties?.name || feature.properties?.barangay;
              if (label) layer.bindTooltip(String(label));
            },
          }).addTo(map);
        })
        .catch(() => {
          if (active) setBoundaryError('Official barangay boundary data could not be loaded.');
        });
    }

    const locationBounds = L.latLngBounds(mapPoints.map((farm) => [Number(farm.latitude), Number(farm.longitude)]));
    if (locationBounds.isValid()) {
      map.fitBounds(locationBounds, { padding: [24, 24], maxZoom: 14 });
    }
    const resizeMap = () => map.invalidateSize({ pan: false });
    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(mapContainer.current);
    window.setTimeout(resizeMap, 100);
    setMapReady(true);

    return () => {
      active = false;
      map.off('click', chooseLocation);
      if (previewMarker.current) previewMarker.current.remove();
      previewMarker.current = null;
      resizeObserver.disconnect();
      markers.forEach((marker) => markerGroup.removeLayer(marker));
      map.remove();
    };
  }, [osmConsent, isDemo, mapPoints, canEditLocations]);

  async function saveLocation() {
    if (!selectedFarmId || !pickedLocation) return;
    setSavingLocation(true);
    setError('');
    try {
      await api.patch(`/api/farms/${selectedFarmId}/location`, pickedLocation);
      setPickedLocation(null);
      setSelectedFarmId('');
      if (previewMarker.current) previewMarker.current.remove();
      previewMarker.current = null;
      await loadFarms();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSavingLocation(false);
    }
  }

  return (
    <main className="records-page">
      <header className="records-topbar"><Brand /><Link to={user.role === 'farmer' ? '/farmer/dashboard' : '/dashboard'} className="records-back"><ArrowLeft size={16} /> Dashboard</Link></header>
      <section className="records-content">
        <div className="records-heading"><div><span className="panel-kicker">FARM LOCATIONS · CALAPAN CITY, ORIENTAL MINDORO</span><h1>{isDemo ? 'Calapan City demo map' : 'Calapan City farm map'}</h1><p>{isDemo ? 'Presentation preview with illustrative farm points and conceptual zones.' : 'Saved farm coordinates inside the approximate Calapan map area.'}</p></div>
          <button className="records-primary secondary" disabled={loading} onClick={loadFarms} type="button"><RefreshCw size={15} /> Refresh</button></div>
        <div className="map-disclaimer"><MapPin size={16} /><span>{isDemo
          ? 'PRESENTATION DEMO ONLY: small, separated sample zones and points are placed approximately on the Calapan mainland for this preview. They are not verified farm locations, real barangay names, or official boundaries, and are not saved to the database.'
          : 'Only saved farm coordinates inside the approximate Calapan map area are shown. Coordinates outside this map extent are omitted. The rectangular extent is for map focus only, not an official city or barangay boundary.'}
          {' The free interactive street map uses OpenStreetMap tiles after you opt in; the tile provider receives your IP address and requested map area.'}</span></div>
        {error && <div className="records-error" role="alert">{error}<button onClick={loadFarms} type="button">Retry</button></div>}
        {mapError && <div className="records-error" role="alert">{mapError} Showing the relative coordinate plot instead.</div>}
        {boundaryError && <div className="records-note" role="status">{boundaryError} Farm points are still available.</div>}
        {mapPoints.length > 0 && <label className="map-consent">
          <input checked={osmConsent} onChange={(event) => setOsmConsent(event.target.checked)} type="checkbox" />
          Load the free interactive OpenStreetMap to view {isDemo ? 'illustrative Calapan demo points' : 'authorized farm coordinates'}. The map provider receives requests for the viewed area.
        </label>}
        {canEditLocations && !isDemo && mapPoints.length > 0 && <section className="map-edit-controls" aria-label="Set farm location">
          <label>Farm to update
            <select disabled={!osmConsent} onChange={(event) => { setSelectedFarmId(event.target.value); setPickedLocation(null); }} value={selectedFarmId}>
              <option value="">Choose a farm before clicking the map</option>
              {editableFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.farm_name || `Farm ${farm.id}`} · {farm.farmer_name}</option>)}
            </select>
          </label>
          <p>{osmConsent ? 'Choose a farm, then click the interactive map to place or drag its location marker.' : 'Opt in to the interactive map above before selecting a farm location.'}</p>
          {pickedLocation && <div className="map-save-location">
            <span>Selected: {pickedLocation.latitude}, {pickedLocation.longitude}</span>
            <button className="records-primary" disabled={savingLocation} onClick={saveLocation} type="button">
              {savingLocation ? 'Saving…' : 'Save farm location'}
            </button>
          </div>}
        </section>}
        <section className="dashboard-panel coordinate-panel">
          {loading ? <div className="chart-empty"><strong>Loading farm locations…</strong></div>
            : !isDemo && mapPoints.length === 0 ? <div className="chart-empty"><span><MapPin size={22} /></span><strong>No saved farm coordinates in the Calapan map area</strong><p>Farm records were found, but none have coordinates inside this map extent. The presentation preview is not substituted for saved records.</p></div>
            : osmConsent && !mapError ? <div aria-label={isDemo ? 'Illustrative Calapan demo map' : 'Calapan farm locations map'} className="interactive-map-container" ref={mapContainer} role="region">
                {!mapReady && <div className="chart-empty"><strong>Loading interactive map…</strong></div>}
              </div> : <svg aria-label={isDemo ? 'Illustrative Calapan City map with demo farm points and conceptual zones' : 'Relative plot of saved farm coordinates'} className="coordinate-plot" role="img" viewBox={`0 0 ${width} ${height}`}>
                <rect height={height} rx="10" width={width} fill="#fbfcfa" />
                {[0, 1, 2, 3, 4].map((line) => {
                  const x = padding + (width - 2 * padding) * line / 4;
                  const y = padding + (height - 2 * padding) * line / 4;
                  return <g key={line}><line x1={x} y1={padding} x2={x} y2={height - padding} stroke="#e8ece4" strokeDasharray="4 5" /><line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e8ece4" strokeDasharray="4 5" /></g>;
                })}
                {isDemo && <>
                  {DEMO_MAP_ZONES.map((zone) => <g key={zone.name}>
                    <polygon points={polygonPoints(zone.coordinates)} fill="#98b67f" fillOpacity="0.22" stroke="#718f5d" strokeDasharray="5 4" strokeWidth="2" />
                    <text className="demo-zone-label" x={projectDemoCoordinate(zone.coordinates[0][0] - 0.001, zone.coordinates[0][1] + 0.001).x} y={projectDemoCoordinate(zone.coordinates[0][0] - 0.001, zone.coordinates[0][1] + 0.001).y}>{zone.name}</text>
                  </g>)}
                  <text className="demo-map-title" x={width / 2} y="25" textAnchor="middle">CALAPAN CITY · ILLUSTRATIVE DEMO AREA</text>
                </>}
                <text x={width / 2} y={height - 9} textAnchor="middle">{isDemo ? 'Longitude (approx.) →' : 'Relative longitude →'}</text>
                <text transform={`translate(14 ${height / 2}) rotate(-90)`} textAnchor="middle">{isDemo ? 'Latitude (approx.) →' : 'Relative latitude →'}</text>
                {mapPoints.map((farm) => <g key={farm.id}>
                  <circle cx={farm.x} cy={farm.y} r="8" fill={isDemo ? '#5f8745' : farmMarkerColor(farm)} stroke="#fff" strokeWidth="3" />
                  <title>{`${farm.farm_name || `Farm ${farm.id}`}${isDemo ? ' · illustrative demo only' : ` · ${farm.farmer_name}`} · ${farm.latitude}, ${farm.longitude}`}</title>
                </g>)}
              </svg>}
          {mapPoints.length > 0 && <div className="map-legend"><MapPin size={14} /> {mapPoints.length} {isDemo ? 'illustrative demo points · conceptual zones, not boundaries' : `farm coordinate${mapPoints.length === 1 ? '' : 's'} · clustered by proximity`}</div>}
        </section>
        {!isDemo && <div className="map-category-legend" aria-label="Map marker categories">
          <span><i style={{ backgroundColor: '#d97706' }} /> Crops</span>
          <span><i style={{ backgroundColor: '#2563eb' }} /> Livestock</span>
          <span><i style={{ backgroundColor: '#7c3aed' }} /> Crops and livestock</span>
          <span><i style={{ backgroundColor: '#45683b' }} /> No crop or livestock records</span>
        </div>}
        {isDemo && <div className="records-table-wrap"><table className="records-table">
          <caption className="map-table-caption">Illustrative demo points — not saved as farm records</caption>
          <thead><tr><th>Demo point</th><th>Conceptual zone</th><th>Approx. latitude</th><th>Approx. longitude</th><th>Data status</th></tr></thead>
          <tbody>{DEMO_FARM_POINTS.map((farm) => <tr key={farm.id}><td>{farm.farm_name}</td><td>{farm.barangay_name}</td><td>{farm.latitude.toFixed(5)}</td><td>{farm.longitude.toFixed(5)}</td><td>Illustrative only</td></tr>)}</tbody>
        </table></div>}
        <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Farm</th><th>Farmer</th><th>Barangay</th><th>Latitude</th><th>Longitude</th></tr></thead>
          <tbody>{loading ? <tr><td className="records-empty" colSpan="5">Loading farm records…</td></tr>
            : points.length === 0 ? <tr><td className="records-empty" colSpan="5">No saved farm coordinates in the Calapan map area.</td></tr>
              : points.map((farm) => <tr key={farm.id}><td>{farm.farm_name || `Farm ${farm.id}`}</td><td>{farm.farmer_name}</td><td>{farm.barangay_name}</td><td>{farm.latitude}</td><td>{farm.longitude}</td></tr>)}
          </tbody>
        </table></div>
        {outsideAreaCount > 0 && <p className="map-legend">{outsideAreaCount} farm record{outsideAreaCount === 1 ? '' : 's'} with coordinates outside this approximate map extent {outsideAreaCount === 1 ? 'is' : 'are'} not shown.</p>}
      </section>
    </main>
  );
}
