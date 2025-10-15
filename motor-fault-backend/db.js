const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Sri@9750',
    database: 'motor_fault_db'
});

db.connect(err => {
    if (err) throw err;
    console.log("✅ Database connected");
});

module.exports = db;
