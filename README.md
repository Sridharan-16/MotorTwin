# Smart Motor Health Monitoring System

## Overview
This project is a real-time monitoring and fault prediction system for industrial motors using sensor data. The system collects current, voltage, and temperature readings from ESP32-based sensors, analyzes them with machine learning models, and provides live visualization and fault diagnostics through a web interface.

## Features
- Real-time sensor data acquisition from ESP32 devices
- Fault prediction using a trained machine learning model (Python)
- Semantic search and chatbot for motor fault history (Python NLP)
- 3D motor visualization (React + Three.js)
- User authentication and role management
- Event logging and notification system
- API for analysis, sensor data upload, and status refresh

## System Architecture
- **Frontend**: React, Three.js, Socket.io-client
- **Backend**: Node.js (Express), Python (ML and NLP services), MySQL database
- **Communication**: REST API, WebSocket (Socket.io)
- **Deployment**: Vite for frontend, Node for backend

## Installation
### Prerequisites
- Node.js (v18+ recommended)
- Python 3.8+
- MySQL Server

### Backend Setup
1. Navigate to `motor-fault-backend`:
   ```sh
   cd motor-fault-backend
   npm install
   ```
2. Configure MySQL credentials in `config/config.js` and Python scripts if needed.
3. Start the backend server:
   ```sh
   npm run dev
   ```
4. Ensure Python dependencies are installed:
   ```sh
   pip install -r requirements.txt
   ```

### Frontend Setup
1. Navigate to `TRY_MOTOR_FRONTEND/motor-visualizer`:
   ```sh
   cd TRY_MOTOR_FRONTEND/motor-visualizer
   npm install
   npm run dev
   ```
2. Open the provided local URL in your browser.

## Usage
- Register/login to access the dashboard.
- View real-time motor data and 3D visualization.
- Use the chatbot to ask about fault history or specific events.
- Receive notifications for detected faults.

## Technologies Used
- **Frontend**: React, Three.js, Vite, Socket.io-client
- **Backend**: Node.js, Express, Socket.io, Python (joblib, sentence-transformers, pandas), MySQL

## Contribution
1. Fork the repository and create a new branch.
2. Make your changes and ensure code quality.
3. Submit a pull request with a clear description of your changes.

## License
This project is licensed under the MIT License.
