const { spawn } = require("child_process");
const path = require("path");

exports.ask = async (req, res) => {
  const userQuestion = req.body.question;
  console.log(userQuestion);
  if (!userQuestion) {
    return res.status(400).json({ error: "No question provided" });
  }

  try {
    const pyProcess = spawn("python", [path.join(__dirname, "../python/motor_nlp_backend.py")]);
    let pythonOutput = "";
    let pythonError = "";

    pyProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      pythonError += data.toString();
      console.error("Python error:", data.toString());
    });

    pyProcess.stdin.write(JSON.stringify({ question: userQuestion }) + "\n");
    pyProcess.stdin.end();

    pyProcess.on("close", () => {
      try {
        // Only parse the last non-empty line in stdout as JSON.
        const lastLine = pythonOutput.trim().split('\n').filter(Boolean).pop() || "";
        const response = JSON.parse(lastLine);
        res.json(response);
      } catch (err) {
        console.error("Parsing error. PyOutput:", pythonOutput, "PyErr:", pythonError);
        res.status(500).json({ error: "Failed to parse Python response", details: pythonError });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
