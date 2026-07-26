const asyncHandler = require('express-async-handler');
const Facility = require('../models/Facility');
const Territory = require('../models/Territory');
const { logAudit } = require('../utils/auditLogger');

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

module.exports = { importFacilities };
