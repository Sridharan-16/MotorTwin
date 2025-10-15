// Node-side simple fault classification (can complement Python model)
exports.classifyFault = (current, voltage, temperature) => {
  if (current > 40 && temperature > 90) return "Motor winding overload";
  if (voltage < 100) return "Field ground fault";
  return "No fault";
};
