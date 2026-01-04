const pool = require('./db');

(async () => {
    try {
        console.log('Fixing households with multiple spouses...\n');
        
        // Xóa Phan Long (ID: 449) khỏi hộ 165
        await pool.query('DELETE FROM NhanKhau WHERE id = 449');
        console.log('✓ Deleted Phan Long (ID: 449) from household 165');
        
        // Xóa Hoàng Huy (ID: 483) khỏi hộ 178
        await pool.query('DELETE FROM NhanKhau WHERE id = 483');
        console.log('✓ Deleted Hoàng Huy (ID: 483) from household 178');
        
        // Verify
        console.log('\n=== Verification ===');
        const [rows] = await pool.query(`
            SELECT id_ho_gia_dinh, COUNT(*) as spouse_count 
            FROM NhanKhau 
            WHERE LOWER(quan_he) LIKE "%vợ%" OR LOWER(quan_he) LIKE "%chồng%" 
            GROUP BY id_ho_gia_dinh
            HAVING spouse_count > 1
        `);
        
        if (rows.length === 0) {
            console.log('✓ All households now have at most 1 spouse');
        } else {
            console.log('❌ Still have households with multiple spouses:');
            console.table(rows);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
