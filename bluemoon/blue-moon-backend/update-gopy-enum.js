const pool = require('./db');

async function updateGopYEnum() {
    try {
        await pool.query(`ALTER TABLE gopy MODIFY COLUMN loai_gop_y ENUM('gop_y','khieu_nai','de_xuat','yeu_cau','khac') DEFAULT 'gop_y'`);
        console.log('Updated loai_gop_y enum successfully');
        process.exit(0);
    } catch (e) {
        console.log('Error:', e.message);
        process.exit(1);
    }
}

updateGopYEnum();
