const userRepository = require('../repositories/UserRepository');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await userRepository.findByEmail(email);
        
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const userId = await userRepository.save({ name, email, password, role: role || 'user' });
        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userRepository.findByEmail(email);

        if (!user || user.password !== password) { // In real app, use bcrypt to compare
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile_image_url: user.profile_image_url
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
