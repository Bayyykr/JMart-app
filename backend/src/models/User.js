class User {
    constructor(id, name, email, password, role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password; // Encapsulated
        this.role = role; // 'user', 'driver', 'admin', 'marketplace'
    }

    // Encapsulation: Method to return safe profile
    getProfile() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role
        };
    }
}

module.exports = User;
