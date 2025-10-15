const { spawn } = require("child_process");
const path = require("path");

exports.runMLPipeline = (sensorData) => {
  return new Promise((resolve, reject) => {
    const pyProcess = spawn("python", [path.join(__dirname, "../python/model_runner.py")]);

    let stdout = "";
    let stderr = "";

    pyProcess.stdout.on("data", (data) => { stdout += data.toString(); });
    pyProcess.stderr.on("data", (data) => { stderr += data.toString(); });

    pyProcess.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr || `Python exited with code ${code}`));
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    // Send JSON via stdin
    pyProcess.stdin.write(JSON.stringify(sensorData));
    pyProcess.stdin.end();
  });
};
