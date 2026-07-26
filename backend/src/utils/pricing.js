// Cascading pharma trade-discount calculator.
//
// Business rule: TP (Trade Price) is the base. If a referring doctor's
// incentive is a product discount (rather than cash commission), that
// discount is taken off TP first. Then the pharmacy's standard discount is
// taken off what's LEFT (cascaded, not summed) - e.g. a 20% doctor discount
// followed by a 15% pharmacy discount is NOT a flat 35% off TP.
//
// If no doctor is involved (or the doctor is paid cash commission instead
// of a product discount), the pharmacy discount is simply applied directly
// to TP.
function calculateCascadingPrice({ tp, doctorDiscountPercent = 0, pharmacyDiscountPercent = 0 }) {
  const base = Number(tp) || 0;
  const doctorPct = Math.min(Math.max(Number(doctorDiscountPercent) || 0, 0), 100);
  const pharmacyPct = Math.min(Math.max(Number(pharmacyDiscountPercent) || 0, 0), 100);

  const priceAfterDoctorDiscount = base * (1 - doctorPct / 100);
  const finalPrice = priceAfterDoctorDiscount * (1 - pharmacyPct / 100);

  return {
    tp: base,
    doctorDiscountPercent: doctorPct,
    doctorDiscountAmount: round2(base - priceAfterDoctorDiscount),
    priceAfterDoctorDiscount: round2(priceAfterDoctorDiscount),
    pharmacyDiscountPercent: pharmacyPct,
    pharmacyDiscountAmount: round2(priceAfterDoctorDiscount - finalPrice),
    finalPrice: round2(finalPrice),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { calculateCascadingPrice };
