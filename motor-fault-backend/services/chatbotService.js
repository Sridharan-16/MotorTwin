const { execFile } = require("child_process");
const path = require("path");

// Input: userQuery string + optional logs
exports.askChatbot = (userQuery, logs = []) => {
  return new Promise((resolve, reject) => {
    const input = JSON.stringify({ query: userQuery, logs });

    execFile("python", [path.join(__dirname, "../chatbot/chatbotEngine.py"), input], (err, stdout, stderr) => {
      if (err) return reject(err);
      try {
        const response = JSON.parse(stdout);
        resolve(response);
      } catch (parseErr) {
        reject(parseErr);
      }
    });
  });
};
