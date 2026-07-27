const { app, request, registerUser, createCustomer } = require('./helpers/factory');

jest.mock('../src/utils/osmPlaces', () => ({
  geocodeCity: jest.fn(),
  searchFacilitiesNear: jest.fn(),
}));
const { geocodeCity, searchFacilitiesNear } = require('../src/utils/osmPlaces');

describe('Facility directory', () => {
  test('creates a facility and links it to a territory', async () => {
    const { token } = await registerUser();
    const territory = await request(app)
      .post('/api/territories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Karachi South' });

    const facility = await request(app)
      .post('/api/facilities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'City Medical Center',
        type: 'hospital',
        territory: territory.body.data._id,
        address: '123 Main Road',
        city: 'Karachi',
        phone: '021-1234567',
        googleMapsUrl: 'https://maps.google.com/?q=City+Medical+Center+Karachi',
      });
    expect(facility.status).toBe(201);
    expect(facility.body.data.type).toBe('hospital');

    const list = await request(app).get('/api/facilities').set('Authorization', `Bearer ${token}`);
    expect(list.body.data[0].territory.name).toBe('Karachi South');
  });

  test('bulk-imports facilities from parsed CSV rows, resolving territory by name', async () => {
    const { token } = await registerUser();

    const result = await request(app)
      .post('/api/facilities/import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rows: [
          { name: 'Al-Shifa Pharmacy', type: 'pharmacy', territoryName: 'Lahore Central', city: 'Lahore', phone: '042-111222' },
          { name: 'Kids Care Clinic', type: 'clinic', territoryName: 'Lahore Central', city: 'Lahore' },
          { name: '', type: 'clinic' }, // invalid row - no name
        ],
      });

    expect(result.status).toBe(201);
    expect(result.body.data.createdCount).toBe(2);
    expect(result.body.data.errors).toHaveLength(1);
    expect(result.body.data.errors[0].message).toMatch(/name is required/);

    const list = await request(app).get('/api/facilities').set('Authorization', `Bearer ${token}`);
    expect(list.body.data.length).toBe(2);
    // Both rows shared the same territory name - should resolve to ONE territory, not two.
    const territoryIds = new Set(list.body.data.map((f) => f.territory._id));
    expect(territoryIds.size).toBe(1);
  });

  test('OSM search geocodes the city then returns nearby named facilities (no API key/billing needed)', async () => {
    const { token } = await registerUser();
    geocodeCity.mockResolvedValue({ lat: 31.5656822, lon: 74.3141829 });
    searchFacilitiesNear.mockResolvedValue([
      {
        osmId: 'node/1',
        name: 'DHA Medical Center',
        type: 'hospital',
        address: 'St 29 Sec W Ph 3',
        city: 'Lahore',
        phone: '',
        latitude: 31.4767,
        longitude: 74.3715,
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=31.4767,74.3715',
      },
    ]);

    const res = await request(app)
      .get('/api/facilities/search-osm?city=Lahore&types=hospital,clinic,pharmacy')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.results).toHaveLength(1);
    expect(res.body.data.results[0].name).toBe('DHA Medical Center');
    expect(geocodeCity).toHaveBeenCalledWith('Lahore');
    expect(searchFacilitiesNear).toHaveBeenCalledWith({ lat: 31.5656822, lon: 74.3141829 }, 5000, ['hospital', 'clinic', 'pharmacy']);
  });

  test('OSM search returns 404 when the city cannot be geocoded', async () => {
    const { token } = await registerUser();
    geocodeCity.mockRejectedValue(new Error('Could not find "Nowheresville" - check the spelling'));

    const res = await request(app)
      .get('/api/facilities/search-osm?city=Nowheresville')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('OSM search requires a city query param', async () => {
    const { token } = await registerUser();
    const res = await request(app).get('/api/facilities/search-osm').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('Visit schedule (beat plan)', () => {
  async function createEmployee(token, overrides = {}) {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: overrides.employeeId || 'EMP-VS-1', name: overrides.name || 'Ahmed Raza', designation: 'Medical Representative' });
    return res.body.data;
  }

  test('a weekly schedule is due only on its matching day of week', async () => {
    const { token } = await registerUser();
    const employee = await createEmployee(token);
    const customer = await createCustomer(token);

    const schedule = await request(app)
      .post('/api/visit-schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assignee: employee._id,
        partyType: 'customer',
        party: customer._id,
        frequency: 'weekly',
        dayOfWeek: 1, // Monday
        purpose: 'retake_order',
      });
    expect(schedule.status).toBe(201);

    const monday = await request(app)
      .get('/api/visit-schedules/due?date=2026-08-03') // a Monday
      .set('Authorization', `Bearer ${token}`);
    expect(monday.body.data.rows.length).toBe(1);
    expect(monday.body.data.rows[0].purpose).toBe('retake_order');

    const tuesday = await request(app)
      .get('/api/visit-schedules/due?date=2026-08-04') // a Tuesday
      .set('Authorization', `Bearer ${token}`);
    expect(tuesday.body.data.rows.length).toBe(0);
  });

  test('a monthly schedule due on the 31st clamps to the last day of a shorter month', async () => {
    const { token } = await registerUser();
    const employee = await createEmployee(token, { employeeId: 'EMP-VS-2' });
    const customer = await createCustomer(token);

    await request(app)
      .post('/api/visit-schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assignee: employee._id,
        partyType: 'customer',
        party: customer._id,
        frequency: 'monthly',
        dayOfMonth: 31,
        purpose: 'collect_invoice',
      });

    // February 2026 only has 28 days - the 31st-of-month schedule should
    // fire on the 28th instead of never firing at all.
    const feb28 = await request(app)
      .get('/api/visit-schedules/due?date=2026-02-28')
      .set('Authorization', `Bearer ${token}`);
    expect(feb28.body.data.rows.length).toBe(1);
    expect(feb28.body.data.rows[0].purpose).toBe('collect_invoice');
  });

  test('the week view returns all 7 days with the correct visits grouped per day', async () => {
    const { token } = await registerUser();
    const employee = await createEmployee(token, { employeeId: 'EMP-VS-3' });
    const customer = await createCustomer(token);

    await request(app)
      .post('/api/visit-schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({ assignee: employee._id, partyType: 'customer', party: customer._id, frequency: 'weekly', dayOfWeek: 3, purpose: 'both' }); // Wednesday

    const week = await request(app)
      .get('/api/visit-schedules/week?start=2026-08-03') // Monday 3rd -> Sunday 9th
      .set('Authorization', `Bearer ${token}`);
    expect(week.body.data.days.length).toBe(7);
    const wednesday = week.body.data.days.find((d) => d.dayName === 'Wednesday');
    expect(wednesday.rows.length).toBe(1);
    const monday = week.body.data.days.find((d) => d.dayName === 'Monday');
    expect(monday.rows.length).toBe(0);
  });

  test('rejects a weekly schedule missing dayOfWeek', async () => {
    const { token } = await registerUser();
    const employee = await createEmployee(token, { employeeId: 'EMP-VS-4' });
    const customer = await createCustomer(token);

    const res = await request(app)
      .post('/api/visit-schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({ assignee: employee._id, partyType: 'customer', party: customer._id, frequency: 'weekly' });
    expect(res.status).toBe(400);
  });
});
