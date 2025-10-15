const db = require('../db');
// User table functions
const createUserTable = () => {
  const sql = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
  )`;
  db.query(sql, (err) => {
    if (err) console.error('Create user table error:', err);
  });
};
// Create Model table
const createModelTable = () => {
  const sql = `CREATE TABLE IF NOT EXISTS models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL
  )`;
  db.query(sql, (err) => {
    if (err) console.error('Create model table error:', err);
  });
};
// Read all models
const getAllModels = cb => {
  db.query('SELECT * FROM models', cb);
};
module.exports = { createUserTable };
module.exports.createModelTable = createModelTable;
module.exports.getAllModels = getAllModels;
