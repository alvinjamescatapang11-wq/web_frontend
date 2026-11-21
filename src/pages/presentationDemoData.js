export const PRESENTATION_METRICS = [
  { label: 'Demo farmers', value: '248', note: 'Across 4 illustrative zones' },
  { label: 'Demo farms', value: '312', note: 'Sample farm profiles' },
  { label: 'Rice plantings', value: '184', note: 'Illustrative active season' },
  { label: 'Harvest recorded', value: '426.8 t', note: 'Demo reporting period' },
];

export const PRESENTATION_DATASETS = [
  {
    id: 'farmers',
    label: 'Farmers',
    columns: ['Registry no.', 'Farmer', 'Demo zone', 'Primary livelihood', 'Status'],
    rows: [
      ['DEMO-2026-001', 'Demo Farmer 01', 'Demo Zone 1', 'Rice', 'Active'],
      ['DEMO-2026-002', 'Demo Farmer 02', 'Demo Zone 1', 'Rice & vegetables', 'Active'],
      ['DEMO-2026-003', 'Demo Farmer 03', 'Demo Zone 2', 'Vegetables', 'Active'],
      ['DEMO-2026-004', 'Demo Farmer 04', 'Demo Zone 3', 'Rice & livestock', 'For review'],
      ['DEMO-2026-005', 'Demo Farmer 05', 'Demo Zone 4', 'Rice', 'Active'],
    ],
  },
  {
    id: 'farms',
    label: 'Farms',
    columns: ['Farm', 'Demo farmer', 'Demo zone', 'Area (ha)', 'Coordinates'],
    rows: [
      ['Demo Farm 01', 'Demo Farmer 01', 'Demo Zone 1', '2.40', '13.40500, 121.16000'],
      ['Demo Farm 02', 'Demo Farmer 02', 'Demo Zone 1', '1.75', '13.40600, 121.16200'],
      ['Demo Farm 03', 'Demo Farmer 03', 'Demo Zone 2', '3.10', '13.39500, 121.20500'],
      ['Demo Farm 04', 'Demo Farmer 04', 'Demo Zone 3', '1.20', '13.37500, 121.15500'],
      ['Demo Farm 05', 'Demo Farmer 05', 'Demo Zone 4', '2.85', '13.37000, 121.19500'],
    ],
  },
  {
    id: 'rice',
    label: 'Rice',
    columns: ['Planting', 'Demo farm', 'Variety (sample)', 'Planted', 'Stage'],
    rows: [
      ['RICE-DEMO-014', 'Demo Farm 01', 'Sample rice variety A', '2026-06-12', 'Tillering'],
      ['RICE-DEMO-015', 'Demo Farm 02', 'Sample rice variety B', '2026-06-21', 'Booting'],
      ['RICE-DEMO-016', 'Demo Farm 03', 'Sample rice variety A', '2026-07-02', 'Vegetative'],
      ['RICE-DEMO-017', 'Demo Farm 04', 'Sample rice variety C', '2026-07-08', 'Seedling'],
      ['RICE-DEMO-018', 'Demo Farm 05', 'Sample rice variety B', '2026-05-28', 'Ripening'],
    ],
  },
  {
    id: 'crops',
    label: 'Crops',
    columns: ['Crop record', 'Demo farm', 'Crop', 'Area (ha)', 'Status'],
    rows: [
      ['CROP-DEMO-031', 'Demo Farm 02', 'Eggplant', '0.35', 'Growing'],
      ['CROP-DEMO-032', 'Demo Farm 03', 'Squash', '0.60', 'Growing'],
      ['CROP-DEMO-033', 'Demo Farm 04', 'String beans', '0.22', 'Harvesting'],
      ['CROP-DEMO-034', 'Demo Farm 05', 'Tomato', '0.40', 'Growing'],
    ],
  },
  {
    id: 'livestock',
    label: 'Livestock',
    columns: ['Record', 'Demo farm', 'Category (sample)', 'Heads', 'Health status'],
    rows: [
      ['LIVE-DEMO-011', 'Demo Farm 01', 'Cattle', '8', 'Routine monitoring'],
      ['LIVE-DEMO-012', 'Demo Farm 02', 'Goats', '14', 'Healthy'],
      ['LIVE-DEMO-013', 'Demo Farm 04', 'Native chickens', '45', 'Healthy'],
      ['LIVE-DEMO-014', 'Demo Farm 05', 'Swine', '6', 'Follow-up scheduled'],
    ],
  },
  {
    id: 'harvests',
    label: 'Harvests',
    columns: ['Harvest', 'Demo farm', 'Commodity', 'Quantity', 'Period'],
    rows: [
      ['HARV-DEMO-041', 'Demo Farm 01', 'Palay', '4.8 t', '2026-08'],
      ['HARV-DEMO-042', 'Demo Farm 02', 'Palay', '3.6 t', '2026-08'],
      ['HARV-DEMO-043', 'Demo Farm 03', 'Palay', '5.2 t', '2026-09'],
      ['HARV-DEMO-044', 'Demo Farm 04', 'String beans', '820 kg', '2026-09'],
      ['HARV-DEMO-045', 'Demo Farm 05', 'Palay', '4.1 t', '2026-10'],
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    columns: ['Report', 'Coverage', 'Period', 'Records', 'Status'],
    rows: [
      ['Demo production summary', 'All demo zones', 'Q3 2026', '126', 'Ready'],
      ['Demo rice monitoring', 'Demo Zones 1 & 2', '2026 wet season', '84', 'Ready'],
      ['Demo livestock health', 'All demo zones', 'September 2026', '38', 'For review'],
    ],
  },
];
