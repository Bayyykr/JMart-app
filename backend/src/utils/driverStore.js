/**
 * driverStore.js
 * In-memory store for transient real-time driver data.
 */

class DriverStore {
    constructor() {
        // Map<userId, { lat, lng, name, vehicle_plate, status, socketId, area }>
        this.drivers = new Map();
    }

    setDriver(userId, data) {
        const id = String(userId);
        this.drivers.set(id, {
            ...this.getDriver(id), // Merge with existing if any
            ...data,
            updatedAt: Date.now()
        });
    }

    getDriver(userId) {
        return this.drivers.get(String(userId)) || null;
    }

    removeDriverBySocket(socketId) {
        for (const [userId, driver] of this.drivers.entries()) {
            if (driver.socketId === socketId) {
                this.drivers.delete(userId);
                return userId; // Return the ID of removed driver
            }
        }
        return null;
    }

    removeDriver(userId) {
        this.drivers.delete(String(userId));
    }

    getAll() {
        return Array.from(this.drivers.values());
    }
}

// Singleton instance
const driverStore = new DriverStore();
module.exports = driverStore;
