const fs = require('fs');
(async ()=>{
  try{
    const env = fs.readFileSync('./.env','utf8');
    const obj = {};
    env.split(/\r?\n/).forEach(l=>{ if(!l||l.trim().startsWith('#')) return; const idx=l.indexOf('='); if(idx>-1){ obj[l.slice(0,idx).trim()]=l.slice(idx+1).trim(); } });
    const mysql = require('mysql2/promise');
    const cn = await mysql.createConnection({host:obj.DB_HOST,user:obj.DB_USER,password:obj.DB_PASSWORD,port:obj.DB_PORT,database:obj.DB_DATABASE});
    const [rows] = await cn.query("SELECT id, username, email, role FROM NguoiDung");
    console.log('Users:', rows);
    await cn.end();
  }catch(e){ console.error('ERROR', e.message); process.exit(1);} 
})();
