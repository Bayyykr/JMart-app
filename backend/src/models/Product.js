class Product {
    constructor(id, name, seller, category, description, price, rating, sold, emoji, condition_status) {
        this.id = id;
        this.name = name;
        this.seller = seller;
        this.category = category;
        this.description = description;
        this.price = price;
        this.rating = rating;
        this.sold = sold;
        this.emoji = emoji;
        this.condition_status = condition_status;
    }
}

module.exports = Product;
