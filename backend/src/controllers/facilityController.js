const asyncHandler = require('express-async-handler');
const Facility = require('../models/Facility');
const Territory = require('../models/Territory');
const { logAudit } = require('../utils/auditLogger');
const { geocodeCity, searchFacilitiesNear } = require('../utils/osmPlaces');

// @desc  Bulk-create facilities from a parsed CSV (rows parsed client-side
//        and posted as JSON - avoids adding a CSV-parsing dependency for
//        what the frontend can already do with a simple split). Territory
//        can be given by name (resolved/created here) since a CSV won't
//        have Territory ObjectIds.
// @route POST /api/facilities/import
// @body  { rows: [{ name, type, territoryName, address, city, phone, contactPerson, latitude, longitude, googleMapsUrl, notes }] }
const importFacilities = asyncHandler(async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400);
    throw new Error('rows must be a non-empty array');
  }

  const territoryCache = new Map();
  async function resolveTerritory(name) {
    if (!name) return undefined;
    const key = name.trim().toLowerCase();
    if (territoryCache.has(key)) return territoryCache.get(key);
    let territory = await Territory.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (!territory) territory = await Territory.create({ name: name.trim() });
    territoryCache.set(key, territory._id);
    return territory._id;
  }

  const created = [];
  const errors = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    try {
      if (!row.name) throw new Error('name is required');
      const territoryId = await resolveTerritory(row.territoryName);
      const facility = await Facility.create({
        name: row.name,
        type: ['hospital', 'clinic', 'pharmacy', 'other'].includes(row.type) ? row.type : 'other',
        territory: territoryId,
        address: row.address,
        city: row.city,
        phone: row.phone,
        contactPerson: row.contactPerson,
        latitude: row.latitude ? Number(row.latitude) : undefined,
        longitude: row.longitude ? Number(row.longitude) : undefined,
        googleMapsUrl: row.googleMapsUrl,
        notes: row.notes,
        createdBy: req.user._id,
      });
      created.push(facility);
    } catch (err) {
      errors.push({ row: i + 1, name: row.name, message: err.message });
    }
  }

  await logAudit({
    user: req.user,
    action: 'action',
    actionLabel: 'import',
    resource: 'Facility',
    resourceId: null,
    after: { importedCount: created.length, errorCount: errors.length },
  });

  res.status(201).json({ success: true, data: { createdCount: created.length, errors } });
});

// @desc  Look up real hospitals/clinics/pharmacies in a Pakistani city from
//        OpenStreetMap (free, no API key/billing - unlike Google Places,
//        OSM's ODbL license explicitly allows pulling results like this
//        into your own database). Returns candidates only; nothing is
//        saved until the caller picks which ones to import.
// @route GET /api/facilities/search-osm?city=Lahore&types=hospital,clinic,pharmacy&radiusKm=5
const searchOsmFacilities = asyncHandler(async (req, res) => {
  const { city, types, radiusKm } = req.query;
  if (!city) {
    res.status(400);
    throw new Error('city is required');
  }
  const typeList = (types ? types.split(',') : ['hospital', 'clinic', 'pharmacy']).map((t) => t.trim());
  // Capped at 15km - a radius search keeps this fast even for a huge metro
  // area like Karachi, where a full administrative-boundary query times out.
  const radiusMeters = Math.min(Number(radiusKm) || 5, 15) * 1000;

  let center;
  try {
    center = await geocodeCity(city);
  } catch (err) {
    res.status(404);
    throw err;
  }

  let results;
  try {
    results = await searchFacilitiesNear(center, radiusMeters, typeList);
  } catch (err) {
    res.status(502);
    throw new Error(`OpenStreetMap lookup failed: ${err.message}`);
  }

  res.json({ success: true, data: { results, attribution: 'Data © OpenStreetMap contributors, ODbL 1.0 (openstreetmap.org/copyright)' } });
});

module.exports = { importFacilities, searchOsmFacilities };
