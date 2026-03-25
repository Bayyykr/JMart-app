const User = require('./User');

class Driver extends User {
    constructor(id, name, email, password, driverType, vehicleInfo) {
        super(id, name, email, password, 'driver');
        this.driverType = driverType; // 'antar-jemput' or 'jastip'
        this.vehicleInfo = vehicleInfo;
        this.balance = 0;
        this.isApproved = false;
        this.servicePrice = 0;
    }

    // Inheritance & Polymorphism: Specific behaviour for Driver
    getProfile() {
        const baseProfile = super.getProfile();
        return {
            ...baseProfile,
            driverType: this.driverType,
            vehicleInfo: this.vehicleInfo,
            balance: this.balance
        };
    }

    setPrice(price) {
        this.servicePrice = price;
    }
}

module.exports = Driver;
