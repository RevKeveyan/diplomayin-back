const express = require('express');
const ProductController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const { authenticateUser } = require('../middleware/AuthMiddleware');
const fileMiddleware = require('../middleware/fileMiddleware');
const { upload } = require('../middleware/fileMidlleware1');

const router = express.Router();

// Public Routes
router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getProdById);

// Authenticated Routes
router.get('/:id/recommended', authenticateUser, ProductController.getRecommendedProducts);
router.get('/:id/discounted', authenticateUser, ProductController.getDiscountedProducts);
router.get('/:id/liked', authenticateUser, ProductController.getLikedProducts);

// Product Modification
router.post('/add/:id', authenticateUser, upload.array("images", 5), ProductController.create);
router.put('/:id', authenticateUser, upload.array("images", 5), ProductController.updateProduct);
router.delete('/:id', authenticateUser, ProductController.deleteProduct);

// Complaints & Offers
router.post('/complaint', authenticateUser, ProductController.sendComplaint);
router.post('/like', authenticateUser, ProductController.likeProduct);

// Offer Routes
const offerRouter = express.Router();
offerRouter.post('/', authenticateUser, ProductController.offerPrice);
offerRouter.post('/response', authenticateUser, ProductController.respondToOffer);
router.use('/offer', offerRouter);

const productRouter = express.Router();
productRouter.use("/products", router);

module.exports = productRouter;
