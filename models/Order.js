const mongoose = require('mongoose');
const { Schema } = mongoose; // Импортируем Schema

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [
      {
        _id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1},
        price: { type: Number, required: true},
      },
    ],
    totalPrice: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['offer','pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'canceled'], 
      default: 'pending' 
    },
    address: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    paymentMethod: { type: Schema.Types.ObjectId, ref: 'PaymentDetails', required: true },
    complaints: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, required: true },
        status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
      },
    ],
  },
  
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
