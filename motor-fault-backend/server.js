const express = require('express');
const cors = require('cors');

const sensorRoutes = require('./routes/sensor');        // optional
const analysisRoutes = require('./routes/analysis');    // optional
const chatbotRoutes = require('./routes/chatbot');

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON

app.use('/api/sensor-data', sensorRoutes);
app.use('/api/analysis-data', analysisRoutes);
app.use('-----', chatbotRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
