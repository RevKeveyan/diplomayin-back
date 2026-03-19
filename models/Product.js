const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  subtitle: { type: String, required: true, maxlength: 30 },
  description: { type: String, required: true, maxlength: 1000 },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },

  brand: { type: String, default: "Generic" },
  size: { type: String, default: "all" }, 
  color: { type: String, default: "all" },
  material: { type: String, default: "all" },
  deliveryType: { type: String, default: "Standard" },
  countryOfOrigin: { type: String, default: "Unknown" },
  author: { type: String, default: "" }, 
  language: { type: String, default: "English" }, 
  warranty: { type: String, default: "" },
  popularity: { type: Number, default: 0 },
  type: { type: String, enum: ["model", "physical"], default: "physical" },

  stock: { type: Number, required: true, min: 0 },
  images: [{ type: String, required: true }],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: { type: [String], default: [] },
  isFeatured: { type: Boolean, default: false },
  tradable: { type: Boolean, default: false },

  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
  },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ProductSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
