'use client';

import { useState } from 'react';
import ResourceManager from '@/components/ResourceManager';
import FacilityCsvImport from '@/components/FacilityCsvImport';
import OsmFacilitySearch from '@/components/OsmFacilitySearch';

const TYPE_LABELS = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  pharmacy: 'Pharmacy',
  other: 'Other',
};

function mapLink(facility) {
  if (facility.googleMapsUrl) return facility.googleMapsUrl;
  if (facility.latitude != null && facility.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`;
  }
  const query = [facility.name, facility.address, facility.city].filter(Boolean).join(', ');
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', render: (f) => TYPE_LABELS[f.type] || f.type },
  { key: 'territory.name', label: 'Area / Territory' },
  { key: 'city', label: 'City' },
  { key: 'phone', label: 'Phone' },
  { key: 'contactPerson', label: 'Contact Person' },
  {
    key: 'map',
    label: 'Map',
    render: (f) => {
      const link = mapLink(f);
      return link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
          View on Map
        </a>
      ) : (
        <span className="text-slate-400">-</span>
      );
    },
  },
];

const fields = [
  { name: 'name', label: 'Name', required: true },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
    required: true,
  },
  { name: 'territory', label: 'Area / Territory', type: 'select-async', endpoint: '/territories', optionLabel: (t) => t.name },
  { name: 'address', label: 'Address' },
  { name: 'city', label: 'City' },
  { name: 'phone', label: 'Phone' },
  { name: 'contactPerson', label: 'Contact Person' },
  { name: 'latitude', label: 'Latitude', type: 'number' },
  { name: 'longitude', label: 'Longitude', type: 'number' },
  { name: 'googleMapsUrl', label: 'Google Maps Link' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

export default function FacilitiesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <OsmFacilitySearch onImported={() => setRefreshKey((k) => k + 1)} />
      <FacilityCsvImport onImported={() => setRefreshKey((k) => k + 1)} />
      <ResourceManager
        key={refreshKey}
        title="Facility Directory (Hospitals, Clinics & Pharmacies)"
        endpoint="/facilities"
        columns={columns}
        fields={fields}
      />
    </div>
  );
}
