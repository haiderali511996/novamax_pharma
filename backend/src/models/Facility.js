const mongoose = require('mongoose');

// Area-wise directory of hospitals/clinics/pharmacies your reps and
// distributors call on. NOT sourced by scraping Google My Business/Maps -
// there's no legitimate way to bulk-copy that into a private database
// (Google's Places API terms are for live lookups, not wholesale caching).
// This is meant to be populated by your own team (manual entry or CSV
// import) or, if you set up a Google Places API key later, a proper
// one-at-a-time verified lookup feature can be added on top of this.
const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['hospital', 'clinic', 'pharmacy', 'other'], default: 'pharmacy' },
    territory: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory' },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    phone: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    // Direct link to the real Google Maps listing - a reference, not a
    // copy of Google's data.
    googleMapsUrl: { type: String, trim: true },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

facilitySchema.index({ territory: 1, type: 1 });

module.exports = mongoose.model('Facility', facilitySchema);
