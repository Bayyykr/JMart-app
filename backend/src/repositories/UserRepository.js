const db = require('../config/db');

class UserRepository {
    async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    async save(user) {
        const { name, email, password, role } = user;
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
        );
        return result.insertId;
    }

    async findById(id) {
        const [rows] = await db.execute('SELECT id, name, email, role, profile_image_url, phone, birthdate, address, is_active FROM users WHERE id = ?', [id]);
        return rows[0];
    }
}

module.exports = new UserRepository();
