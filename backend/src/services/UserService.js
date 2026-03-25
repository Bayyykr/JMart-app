const User = require('../models/User');

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async registerUser(userData) {
        // Business logic for registration
        const { name, email, password, role } = userData;
        // In real app, hash password here
        const user = new User(Date.now(), name, email, password, role || 'user');
        // await this.userRepository.save(user);
        return user.getProfile();
    }

    async getUserById(id) {
        // Logic to fetch user
        return null;
    }
}

module.exports = UserService;
