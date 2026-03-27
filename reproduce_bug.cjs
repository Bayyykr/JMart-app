const db = require('./backend/src/config/db');
const authController = require('./backend/src/controllers/authController');
const bcrypt = require('bcryptjs');

async function reproduce() {
    const email = 'test_deactivated@jmart.com';
    const password = 'password123';
    
    try {
        console.log('--- Step 1: Cleaning up existing test user ---');
        await db.execute('DELETE FROM users WHERE email = ?', [email]);
        
        console.log('--- Step 2: Registering test user ---');
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
            ['Test Deactivated', email, hashedPassword, 'user', 0] // Pre-deactivated
        );
        const userId = result.insertId;
        console.log('Created deactivated user with ID:', userId);
        
        console.log('--- Step 3: Attempting to login ---');
        const req = { body: { email, password } };
        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.data = data;
                return this;
            }
        };
        
        await authController.login(req, res);
        
        console.log('Login Status Code:', res.statusCode || 200);
        console.log('Login Response:', res.data);
        
        if (res.statusCode === 403 && res.data.message === 'DEACTIVATED') {
            console.log('SUCCESS: Deactivation logic IS WORKING (403 returned).');
        } else if (res.statusCode === 200 || !res.statusCode) {
            console.log('FAILURE: User could login even when is_active=0!');
        } else {
            console.log('OTHER:', res.statusCode, res.data);
        }
        
        // Clean up
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

reproduce();
