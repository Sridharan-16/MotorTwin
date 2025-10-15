const db = require('../db');
const pythonService = require('../services/pythonService');

async function sensorController(req, res) {
    const { current, voltage, temp } = req.body; // FIXED: use "temp"
    console.log(req.body);

    try {
        // Step 1: Send sensor data to Python ML model
        const result = await pythonService.runMLPipeline({ current, voltage, temp });

        // Python returns something like { fault: "Commutator", confidence: 0.92 }
        const fault = result.fault || "Unknown";

        // Step 2: Store input + fault into DB
        const inputData = JSON.stringify({ current, voltage, temp });
        const sql = `INSERT INTO motor_data (input, fault) VALUES (?, ?)`;

        db.query(sql, [inputData, fault], (err, dbResult) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            // Emit real-time update
            const io = req.app.get('io');
            if (io) {
                io.emit('motor-update', {
                    id: dbResult.insertId,
                    fault: fault,
                    confidence: result.confidence || null,
                    timestamp: new Date().toISOString(),
                    input: { current, voltage, temp }
                });
            }

            res.json({
                message: 'Data received, processed, and stored',
                id: dbResult.insertId,
                fault: fault,
                confidence: result.confidence
            });
        });
    } catch (error) {
        console.error("ML Pipeline Error:", error);
        res.status(500).json({ error: 'ML model failed' });
    }
}


module.exports = sensorController;
