const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String, default: null },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    likedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    recommendedProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],
    preferredCategories: [{ type: String }],
    preferredTags: [{ type: String }],
    preferredTypes: [{ type: String, enum: ["model", "physical"] }],
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
    passwordResetCode: { type: String },
    passwordResetExpiration: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
