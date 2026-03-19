const express = require('express');
const cartController = require('../controllers/cartController');
const { authenticateUser, authenticateAdmin } = require("../middleware/AuthMiddleware");

const router = express.Router();

router.get('/:id/', authenticateUser, cartController.getCartItems);
router.post('/:id/add', authenticateUser, cartController.addToCart);
router.post('/remove', authenticateUser, cartController.removeFromCart);
router.post('/clear', authenticateUser, cartController.clearCart);

const cartRouter = express.Router();
cartRouter.use("/cart", router);

module.exports = cartRouter;