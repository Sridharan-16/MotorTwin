const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// GET latest motor analysis
router.get('/', analysisController.getLatestAnalysis);

module.exports = router;
