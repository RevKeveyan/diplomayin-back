const mongoose = require('mongoose');
const { Schema } = mongoose; // Импортируем Schema

const cartSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    items: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true, default: 1, min: 1 } // Количество товара
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('Cart', cartSchema);
