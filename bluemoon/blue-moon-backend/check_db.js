const fs = require('fs');
(async ()=>{
  try{
    const env = fs.readFileSync('./.env','utf8');
    const obj = {};
    env.split(/\r?\n/).forEach(l=>{ if(!l||l.trim().startsWith('#')) return; const idx=l.indexOf('='); if(idx>-1){ obj[l.slice(0,idx).trim()]=l.slice(idx+1).trim(); } });
    const mysql = require('mysql2/promise');
    const cn = await mysql.createConnection({host:obj.DB_HOST,user:obj.DB_USER,password:obj.DB_PASSWORD,port:obj.DB_PORT});
    const [rows] = await cn.query('SHOW DATABASES');
    console.log('Databases:', rows.map(r=>Object.values(r)[0]));
    const [exists] = await cn.query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", [obj.DB_DATABASE]);
    console.log('Configured DB:', obj.DB_DATABASE, 'exists?', exists.length>0);
    await cn.end();
  }catch(e){ console.error('ERROR', e.message); process.exit(1);} 
})();
