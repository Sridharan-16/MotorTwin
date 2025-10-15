// Node-side simple risk prediction (time-series logic optional)
exports.predictRisk = (current, voltage, temperature) => {
  if (temperature > 80) return "High risk of bearing failure";
  return "Low risk";
};
