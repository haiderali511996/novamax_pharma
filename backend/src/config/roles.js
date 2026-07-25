const ROLES = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'manager',
  PHARMACIST: 'pharmacist',
  SALES: 'sales',
  HR: 'hr',
  ACCOUNTANT: 'accountant',
  STAFF: 'staff',
});

module.exports = { ROLES, ROLE_VALUES: Object.values(ROLES) };
