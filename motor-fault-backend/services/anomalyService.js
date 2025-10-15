// Can implement additional Node-side anomaly logic if needed
exports.checkAnomaly = (current, voltage, temperature) => {
  // Example: sudden spikes beyond threshold
  if (current > 50 || voltage > 250 || temperature > 100) return 1;
  return 0;
};


// required python code