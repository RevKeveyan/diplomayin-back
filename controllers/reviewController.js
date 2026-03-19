const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const BaseController = require("./baseController");

class ReviewController extends BaseController {
  constructor() {
    super(Review);
  }

  getReviewsByProduct = async (req, res) => {
    try {
      const { productId } = req.params;
      const reviews = await this.BaseModel.find({ product: productId })
        .populate("user", "firstName lastName email");
      res.status(200).json({ reviews });
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews", error: error.message });
    }
  };

  getReviewsBySellerId = async (req, res) => {
    try {
      const { sellerId } = req.params;

      const sellerProducts = await Product.find({ seller: sellerId }).select("_id");

      if (!sellerProducts.length) {
        return res.status(200).json({ reviews: [] });
      }

      const reviews = await this.BaseModel.find({ product: { $in: sellerProducts.map((p) => p._id) } })
        .populate("user", "firstName lastName email")
        .populate("product", "name");

      res.status(200).json({ reviews });
    } catch (error) {
      res.status(500).json({ message: "Error fetching seller reviews", error: error.message });
    }
  };

  addOrUpdateReview = async (req, res) => {
    try {
      const { productId, rating, comment } = req.body;
      const userId = req.user.id;
  
      // 🔹 Проверяем, не является ли пользователь продавцом товара
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      if (product.seller.toString() === userId) {
        return res.status(403).json({ message: "Sellers cannot review their own products" });
      }
  
      // 🔹 Проверяем, есть ли завершённый заказ для этого товара
      const completedOrder = await Order.findOne({
        user: userId,
        "products._id": productId,
        status: "delivered", // Только доставленные заказы
      });
  
      if (!completedOrder) {
        return res.status(403).json({ message: "You can only review products that have been delivered" });
      }
  
      // 🔹 Проверяем, оставлял ли пользователь уже отзыв
      let review = await Review.findOne({ user: userId, product: productId });
  
      if (review) {
        // ✅ Если отзыв есть – обновляем
        review.rating = rating;
        review.comment = comment;
        await review.save();
      } else {
        // ✅ Если отзыва нет – создаём новый
        review = new Review({ user: userId, product: productId, rating, comment });
        await review.save();
  
        // Добавляем review в продукт
        await Product.findByIdAndUpdate(productId, {
          $push: { reviews: review._id }
        });
      }
  
      res.status(200).json({ message: "Review added or updated successfully", review });
    } catch (error) {
      res.status(500).json({ message: "Error adding/updating review", error: error.message });
    }
  };
  

  deleteReview = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const review = await this.BaseModel.findById(id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      if (review.user.toString() !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "You are not allowed to delete this review" });
      }

      await this.BaseModel.findByIdAndDelete(id);

      // 🔥 Удаляем review из продукта
      await Product.findByIdAndUpdate(review.product, {
        $pull: { reviews: review._id }
      });

      res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting review", error: error.message });
    }
  };

  getUserStats = async (req, res) => {
    try {
      const { userId } = req.params;
  
      const userProducts = await Product.find({ seller: userId }).select("_id");
  
      const reviews = await this.BaseModel.find({ product: { $in: userProducts.map((p) => p._id) } });
  
      const totalRatings = reviews.length;
      const totalRatingScore = reviews.reduce((sum, review) => sum + review.rating, 0);
      const rating = totalRatings > 0 ? (totalRatingScore / totalRatings).toFixed(2) : 0;
  
      const totalPurchases = await Order.countDocuments({ user: userId });
  
      const totalSales = await Order.countDocuments({ "products.product": { $in: userProducts.map((p) => p._id) } });
  
      res.status(200).json({
        totalPurchases,
        totalSales,
        rating: parseFloat(rating), 
        totalRatings,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching user stats", error: error.message });
    }
  };
}

module.exports = new ReviewController(Review);
