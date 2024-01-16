const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    brand: { type: String, required: true },
    comments: [{
        user: { type: String, required: true },
        comment: { type: String, required: true },
    }],
    imagePaths: [{ type: String, required: true }], // Lưu danh sách đường dẫn ảnh
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
