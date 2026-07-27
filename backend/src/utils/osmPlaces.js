const https = require('https');

// Free, no-API-key facility lookup backed by OpenStreetMap. Unlike Google's
// Places API terms (live lookups only, no bulk copying), OpenStreetMap data
// is published under the ODbL specifically to allow pulling it into your
// own database - which is exactly what this does, on demand, per search.
//
// Nominatim (geocoding) usage policy requires a real identifying User-Agent
// and caps usage at roughly one request/second - fine for an admin
// triggering an occasional manual search, not for bulk/automated polling.
const USER_AGENT = 'NovaMaxERP-FacilityDirectory/1.0 (internal pharma ERP tool)';
const TYPE_TAGS = { hospital: 'hospital', clinic: 'clinic', pharmacy: 'pharmacy' };

function httpGet(url, headers) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 400) return reject(new Error(`Request failed (${res.statusCode}): ${body.slice(0, 200)}`));
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(new Error(`Invalid response: ${body.slice(0, 200)}`));
          }
        });
      })
      .on('error', reject);
  });
}

function httpPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(body, 'utf8');
    const req = https.request(
      url,
      { method: 'POST', headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': data.length } },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 429 || res.statusCode === 504) {
            return reject(
              new Error('OpenStreetMap\'s free public server is busy right now (rate-limited or overloaded) - please wait a minute and try again, or try a smaller radius.')
            );
          }
          if (res.statusCode >= 400) return reject(new Error(`Overpass request failed (${res.statusCode})`));
          try {
            resolve(JSON.parse(responseBody));
          } catch (err) {
            reject(new Error('OpenStreetMap returned an unexpected response - please try again.'));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Resolves a city/area name (assumed Pakistan) to a center point via
// Nominatim's free geocoder. A radius search around this point (rather than
// the full administrative-boundary bbox) keeps the query fast even for
// huge metro areas like Karachi, and maps better to "area-wise" lookups
// anyway - a rep works one neighborhood/territory at a time, not a whole city.
async function geocodeCity(city) {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: `${city}, Pakistan`,
    format: 'json',
    limit: '1',
  })}`;
  const results = await httpGet(url, { 'User-Agent': USER_AGENT });
  if (!results.length) throw new Error(`Could not find "${city}" - check the spelling, or try a specific neighborhood/area name instead of the whole city`);
  return { lat: Number(results[0].lat), lon: Number(results[0].lon) };
}

function addressFromTags(tags) {
  const parts = [tags['addr:street'], tags['addr:sector'], tags['addr:suburb']].filter(Boolean);
  return parts.join(', ');
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Queries OpenStreetMap's public Overpass API for named hospitals/clinics/
// pharmacies within radiusMeters of a center point.
//
// Uses a plain bounding-box filter rather than Overpass's "around" filter -
// "around" needs to compute a distance check against every node in the
// database before it can apply the box, which reliably times out on the
// free public instance for anything but a tiny radius. A bbox query is
// index-backed and fast; the exact radius is then re-applied in JS below.
async function searchFacilitiesNear(center, radiusMeters, types) {
  // ~111,320 meters per degree of latitude; longitude degrees shrink with
  // cos(latitude), which matters at Pakistan's ~24-34°N range.
  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));
  const bbox = {
    south: center.lat - latDelta,
    north: center.lat + latDelta,
    west: center.lon - lonDelta,
    east: center.lon + lonDelta,
  };

  const tagFilters = types
    .map((t) => TYPE_TAGS[t])
    .filter(Boolean)
    .map((tag) => `node["amenity"="${tag}"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`)
    .join('');
  const query = `[out:json][timeout:20];(${tagFilters});out body 100;`;

  const result = await httpPost('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`, {
    'User-Agent': USER_AGENT,
  });

  return (result.elements || [])
    .filter((el) => el.tags && el.tags.name && haversineMeters(center.lat, center.lon, el.lat, el.lon) <= radiusMeters)
    .map((el) => ({
      osmId: `node/${el.id}`,
      name: el.tags.name,
      type: el.tags.amenity in TYPE_TAGS ? el.tags.amenity : 'other',
      address: addressFromTags(el.tags),
      city: el.tags['addr:city'] || '',
      phone: el.tags.phone || el.tags['contact:phone'] || '',
      latitude: el.lat,
      longitude: el.lon,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${el.lat},${el.lon}`,
    }));
}

module.exports = { geocodeCity, searchFacilitiesNear };
