const jwt = require('jsonwebtoken');

const userRepository = require('../repositories/UserRepository');

exports.authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Strict DB check for every protected request to enforce "immediate" deactivation/role change
        const user = await userRepository.findById(decoded.id);
        if (!user || user.is_active != 1) {
            console.log(`[AUTH] Blocking deactivated user ${decoded.id} (status: ${user?.is_active})`);
            return res.status(403).json({ message: 'DEACTIVATED' });
        }

        // Sync role from DB in case it changed since token was issued
        req.user.role = user.role;

        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
