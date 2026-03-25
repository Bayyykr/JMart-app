class Order {
    constructor(id, userId, driverId, type, status, totalPrice, items = []) {
        this.id = id;
        this.userId = userId;
        this.driverId = driverId;
        this.type = type; // 'delivery', 'jastip'
        this.status = status; // 'pending', 'accepted', 'ongoing', 'completed'
        this.totalPrice = totalPrice;
        this.items = items; // For Jastip or Marketplace
        this.createdAt = new Date();
    }

    updateStatus(newStatus) {
        this.status = newStatus;
    }
}

module.exports = Order;
