const db = require('../db');
exports.getLatestAnalysis = (req,res)=>{
    console.log('Get request came to analysis part');
    const sql = `
    SELECT fault
    FROM motor_data
    ORDER BY timestamp DESC
    LIMIT 1`;
    db.query(sql,(err,result)=>{
        if(err)
        {
            console.log(err.message);
            return res.serverStatus(500).json({ error: "Database error" });
        }
        console.log(result)
        if(result[0]['fault']==="Healthy")
        {
            return res.json(`The motor is healthy no problem`);
        }
        return res.json(`There is a issue ${result[0]['fault']} and risk in your device`);
    })
}