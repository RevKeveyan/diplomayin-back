const express = require('express');
const ProductController = require('../controllers/productController');
const { authenticateUser } = require('../middleware/AuthMiddleware');

const router = express.Router();


router.post('/', authenticateUser, ProductController.offerPrice);
router.post('/response', authenticateUser, ProductController.respondToOffer);

const offerRouter = express.Router();
offerRouter.use('/offer', router);

module.exports = offerRouter;
