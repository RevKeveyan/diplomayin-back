const Order = require("../models/Order");
const Cart = require("../models/Cart");
const BaseController = require("./baseController");
const Products = require("../models/Product");
const Review = require("../models/Review");
const sendEmail = require("../mailer/send-mail");

class OrderController extends BaseController {
  constructor() {
    super(Order);
  }
  
  createOrder = async (req, res) => {
    try {
      const { products, addressId, paymentMethodId } = req.body;
      const userId = req.user.id;
  
      if (!addressId || !paymentMethodId) {
        return res.status(400).json({ message: "Address and payment method are required" });
      }
      if(req.body.totalprice <= 0){
        return res.status(404).json({ message: "Cart is empty" });
      }

      let totalPrice = 0;
      const processedProducts = [];
  
      for (const item of products) {
        const product = await Products.findById(item._id);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
  
        if (product.seller.toString() === userId) {
          return res.status(403).json({ message: "You cannot purchase your own product" });
        }
  
        const finalPrice = product.discount
          ? product.price * (1 - product.discount / 100)
          : product.price;
  
        totalPrice += finalPrice * (item.quantity || 1);
  
        processedProducts.push({
          ...item,
          price: finalPrice,
        });
      }
  
      // ✅ Создаём заказ
      const newOrder = new Order({
        user: userId,
        products: processedProducts,
        totalPrice: totalPrice.toFixed(2),
        address: addressId,
        paymentMethod: paymentMethodId,
        status: "pending",
      });
  
      await newOrder.save();
  
      // ✅ Удаляем купленные товары из корзины
      const cart = await Cart.findOne({ user: userId });
      if (cart) {
        // Оставляем только те товары, которых нет в заказе
        cart.items = cart.items.filter(
          (cartItem) => !products.some((p) => p._id === cartItem.product.toString())
        );
        await cart.save();
      }
  
      res.status(201).json({ message: "Order created successfully", order: newOrder });
    } catch (error) {
      res.status(500).json({ message: "Error creating order", error: error.message });
    }
  };
  
  
  offerOrder = async (req, res) => {
    try {
      const { products, addressId, paymentMethodId, offeredPrice } = req.body;
      const userId = req.user.id;
  
      if (!addressId || !paymentMethodId) {
        return res.status(400).json({ message: "Address and payment method are required" });
      }
  
      let totalPrice = 0;
      const processedProducts = [];
  
      for (const item of products) {
        const product = await Products.findById(item._id);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
  
        // 🔥 Проверка: продавец не может сделать предложение на свой товар
        if (product.seller.toString() === userId) {
          return res.status(403).json({ message: "You cannot make an offer on your own product" });
        }
  
        let finalPrice = product.price;
        if (product.tradable && offeredPrice) {
          finalPrice = offeredPrice;
        }
  
        totalPrice += finalPrice * (item.quantity || 1);
        processedProducts.push({ ...item, price: finalPrice });
      }
  
      const newOrder = new Order({
        user: userId,
        products: processedProducts,
        totalPrice: totalPrice.toFixed(2),
        address: addressId,
        paymentMethod: paymentMethodId,
        status: offeredPrice ? "offer" : "pending",
      });
  
      await newOrder.save();
      res.status(201).json({ message: "Order created successfully", order: newOrder });
    } catch (error) {
      res.status(500).json({ message: "Error creating order", error: error.message });
    }
  };
  

  getUserOrders = async (req, res) => {
    try {
      const userId = req.user.id;
      const { status } = req.query;
  
      const filter = { user: userId };
      if (status === "active") {
        filter.status = { $in: ["pending", "confirmed", "preparing", "shipped"] };
      } else if (status === "history") {
        filter.status = { $in: ["delivered"] };
      } else if (status === "disputes") {
        filter.status = "canceled";
      }else if (status === "offers") {
        filter.status = "offer";
      }
  
      const orders = await this.BaseModel.find(filter)
        .populate({
          path: "products._id",
          populate: {
            path: "reviews",
            match: { user: userId }, // Получаем только отзыв текущего пользователя
            select: "rating comment createdAt"
          }
        })
        .populate("address")
        .populate("paymentMethod");
  
      res.status(200).json({ orders });
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
  };
  

  
  getOrdersBySellerId = async (req, res) => {
    try {
      const sellerId = req.params.id;
      const { status } = req.query;

      const productIds = await this.getProductsBySeller(sellerId);
      if (!productIds.length) {
        return res.status(200).json({ orders: [] });
      }

      const filter = { "products._id": { $in: productIds } };
      if (status === "active") {
        filter.status = { $in: ["pending", "confirmed", "preparing", "shipped"] };
      } else if (status === "history") {
        filter.status = { $in: ["delivered"] };
      } else if (status === "disputes") {
        filter.status = "canceled";
      }else if (status === "offers") {
        filter.status = "offer";
      }

      const orders = await this.BaseModel.find(filter)
        .populate("products._id")
        .populate("user", "name email")
        .populate("address")
        .populate("paymentMethod");

      res.status(200).json({ orders });
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders for seller", error: error.message });
    }
  };

  getProductsBySeller = async (sellerId) => {
    const products = await Products
      .find({ seller: sellerId })
      .select("_id");
    return products.map((p) => p._id);
  };

  getOrderById = async (req, res) => {
    try {
      const { id } = req.params;
      const order = await this.BaseModel.findById(id)
        .populate("products.product")
        .populate("address")
        .populate("paymentMethod");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json(order);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching order", error: error.message });
    }
  };

  updateOrderStatus = async (req, res) => {
    try {
      const { status } = req.body;
      const { id } = req.params;
  
      const order = await this.BaseModel.findById(id).populate("user", "email firstName");
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      order.status = status;
      await order.save();
  
      // 📧 Отправка письма пользователю
      const subject = "Order Status Updated";
      const text = `Hello ${order.user.firstName},\n\nYour order #${order._id} status has been updated to "${status.toUpperCase()}".\n\nThank you for shopping with us!`;
  
      await sendEmail(order.user.email, subject, text);
  
      res.status(200).json({ message: "Order status updated and email sent", order });
    } catch (error) {
      res.status(500).json({ message: "Error updating order status", error: error.message });
    }
  };
  
  
  // 5️⃣ Отмена заказа (Пользователь)
  cancelOrder = async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;
  
      if (!reason) {
        return res.status(400).json({ message: "Cancellation reason is required" });
      }
  
      const order = await this.BaseModel.findOne({ _id: id, user: userId });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      if (order.status === "canceled" || order.status === "delivered") {
        return res.status(400).json({ message: "Order cannot be canceled" });
      }
  
      order.complaints.push({
        userId: userId,
        reason: reason,
        status: "pending",
      });
  
      order.status = "canceled";
      await order.save();
  
      res.status(200).json({ message: "Order canceled successfully", order });
    } catch (error) {
      res.status(500).json({ message: "Error canceling order", error: error.message });
    }
  };
  

  confirmOrderReceived = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await this.BaseModel.findOne({ _id: id, user: userId });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status !== "shipped") {
        return res.status(400).json({ message: "Order cannot be confirmed" });
      }

      order.status = "delivered";
      await order.save();
      res.status(200).json({ message: "Order received and completed", order });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error confirming order", error: error.message });
    }
  };

  // 7️⃣ Получение всех заказов (Админ)
  getAllOrders = async (req, res) => {
    try {
      const orders = await this.BaseModel.find()
        .populate("products.product")
        .populate("user", "name email")
        .populate("address")
        .populate("paymentMethod");

      res.status(200).json({ orders });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching all orders", error: error.message });
    }
  };
}

module.exports = new OrderController(Order);
