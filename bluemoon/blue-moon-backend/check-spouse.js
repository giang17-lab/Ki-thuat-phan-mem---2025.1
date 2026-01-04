const pool = require('./db');

(async () => {
    try {
        console.log('Checking spouse relationships...\n');
        
        const [rows] = await pool.query(`
            SELECT id, id_ho_gia_dinh, ho_ten, quan_he 
            FROM NhanKhau 
            WHERE LOWER(quan_he) LIKE "%vợ%" OR LOWER(quan_he) LIKE "%chồng%" 
            ORDER BY id_ho_gia_dinh, id
        `);
        
        console.table(rows);
        
        // Group by household
        const grouped = {};
        rows.forEach(r => {
            if (!grouped[r.id_ho_gia_dinh]) grouped[r.id_ho_gia_dinh] = [];
            grouped[r.id_ho_gia_dinh].push(r);
        });
        
        console.log('\n=== Households with multiple spouses ===');
        Object.entries(grouped).forEach(([hoId, members]) => {
            if (members.length > 1) {
                console.log(`\nHousehold ${hoId} has ${members.length} spouses:`);
                members.forEach(m => console.log(`  - ${m.ho_ten} (ID: ${m.id})`));
            }
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
