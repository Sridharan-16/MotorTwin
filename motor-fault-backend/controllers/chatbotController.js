const { spawn } = require("child_process");
const path = require("path");

exports.ask = async (req, res) => {
  const userQuestion = req.body.question;
    console.log(userQuestion);
  if (!userQuestion) {
    return res.status(400).json({ error: "No question provided" });
  }

  try {
    // Spawn Python backend
    const pyProcess = spawn("python", [path.join(__dirname, "../python/motor_nlp_backend.py")]);

    let pythonOutput = "";

    // Send JSON question via stdin
    pyProcess.stdin.write(JSON.stringify({ question: userQuestion }) + "\n");
    pyProcess.stdin.end();

    // Collect stdout
    pyProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });

    // Collect stderr
    pyProcess.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    pyProcess.on("close", () => {
      try {
        // Clean any extra output
        pythonOutput = pythonOutput.trim();

        const response = JSON.parse(pythonOutput);
        res.json(response);
      } catch (err) {
        console.error("Parsing error:", pythonOutput);
        res.status(500).json({ error: "Failed to parse Python response" });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
