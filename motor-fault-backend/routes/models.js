const express = require('express');
const { getAllModels } = require('../models/motorData');
const router = express.Router();

router.get('/', (req, res) => {
  getAllModels((err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

// Store selected model in session
router.post('/select', (req, res) => {
  const { modelId } = req.body;
  if (!modelId) return res.status(400).json({ error: 'modelId required' });
  req.session.selectedModelId = modelId;
  res.json({ message: 'Model selected', modelId });
});

module.exports = router;
