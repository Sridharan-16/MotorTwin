const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { createUserTable } = require('./models/motorData');
const { createModelTable } = require('./models/motorData');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const sensorRoutes = require('./routes/sensor');        // optional
const analysisRoutes = require('./routes/analysis');    // optional
const chatbotRoutes = require('./routes/chatbot');
const modelRoutes = require('./routes/models');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON

createUserTable();
createModelTable();

app.use(session({
  secret: 'iot-motor-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// =====================
// API endpoints FIRST
// =====================
app.use('/api/sensor-data', sensorRoutes);
app.use('/api/analysis-data', analysisRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);

// =====================
// Static serving LAST
// =====================
const frontendBuildPath = path.join(__dirname, '..', 'TRY_MOTOR_FRONTEND', 'motor-visualizer', 'dist');
app.use(express.static(frontendBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// =====================
// Socket.IO and Server Listen
// =====================
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
