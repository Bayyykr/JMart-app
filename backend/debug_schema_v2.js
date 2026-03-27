const db = require('./src/config/db');

const fs = require('fs');

async function checkSchema() {
    try {
        const [columns] = await db.query('SHOW COLUMNS FROM merchant_profiles');
        let output = '--- merchant_profiles columns ---\n';
        output += JSON.stringify(columns, null, 2);
        
        const [profile] = await db.query('SELECT * FROM merchant_profiles LIMIT 1');
        output += '\n\n--- sample profile ---\n';
        output += JSON.stringify(profile[0], null, 2);
        
        fs.writeFileSync('schema_output.txt', output);
        console.log('Schema exported to schema_output.txt');
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

checkSchema();
