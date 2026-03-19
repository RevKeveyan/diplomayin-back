const Cart = require('../models/Cart');
const BaseController = require('./baseController');

class CartController extends BaseController {
  constructor(Cart) {
    super(Cart);
  }

  addToCart = async (req, res) => {
    try {
      const userId = req.params.id;
      const { productId } = req.body;

      let cart = await Cart.findOne({ user: userId });

      if (!cart) {
        // Create a new cart if it doesn't exist
        cart = new Cart({ user: userId, items: [{ product: productId, quantity: 1 }] });
        await cart.save();
        return res.status(201).json({ message: 'Product added to cart', cart });
      }

      // Check if the product is already in the cart
      const existingItem = cart.items.find((item) => item.product.toString() === productId);

      if (existingItem) {
        existingItem.quantity += 1; // Increase quantity
      } else {
        cart.items.push({ product: productId, quantity: 1 });
      }

      await cart.save();
      res.status(200).json({ message: 'Product added to cart', cart });
    } catch (error) {
      res.status(500).json({ message: 'Error adding product to cart', error: error.message });
    }
  };

  // ✅ Remove product (decrease quantity or remove if it's the last one)
  removeFromCart = async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.body;

      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      // Find item in cart
      const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Product not found in cart' });
      }

      if (cart.items[itemIndex].quantity > 1) {
        cart.items[itemIndex].quantity -= 1; // Decrease quantity
      } else {
        cart.items.splice(itemIndex, 1); // Remove item if quantity is 1
      }

      await cart.save();
      res.status(200).json({ message: 'Product removed from cart', cart });
    } catch (error) {
      res.status(500).json({ message: 'Error removing product from cart', error: error.message });
    }
  };

  // ✅ Clear cart completely
  clearCart = async (req, res) => {
    try {
      const userId = req.user.id;

      const cart = await Cart.findOneAndUpdate(
        { user: userId },
        { items: [] }, 
        { new: true }
      );

      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      res.status(200).json({ message: 'Cart cleared', cart });
    } catch (error) {
      res.status(500).json({ message: 'Error clearing cart', error: error.message });
    }
  };

  getCartItems = async (req, res) => {
    try {
      const userId = req.params.id;
      const page = parseInt(req.query.page) || 1; // Номер страницы
      const limit = 10; // Количество товаров на странице
      const skip = (page - 1) * limit; // Пропускаем товары для пагинации
  
      const cart = await Cart.findOne({ user: userId })
        .populate({
          path: "items.product",
          options: { skip, limit }, // Пагинация для товаров
        });
  
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
  
      // Преобразуем `items` в `products`, сохраняя `quantity`
      const products = cart.items.map((item) => ({
        ...item.product.toObject(), // Вытаскиваем данные о товаре
        quantity: item.quantity, // Добавляем `quantity`
      }));
  
      // Узнаем общее количество товаров в корзине
      const totalProducts = cart.items.length;
      const totalPages = Math.ceil(totalProducts / limit);
  
      res.status(200).json({
        cart: {
          products,
          totalProducts,
          totalPages,
          currentPage: page,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching cart items",
        error: error.message,
      });
    }
  };
  
  
}

module.exports = new CartController(Cart);
