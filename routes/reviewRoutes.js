const express = require("express");
const reviewController = require("../controllers/reviewController");
const { authenticateUser, authenticateAdmin } = require("../middleware/AuthMiddleware");

const router = express.Router();

router.get("/product/:productId", reviewController.getReviewsByProduct);

router.get("/seller/:sellerId",authenticateUser, reviewController.getReviewsBySellerId);

router.post("/add", authenticateUser, reviewController.addOrUpdateReview);

router.get("/stats/:userId", authenticateUser, reviewController.getUserStats);

router.delete("/delete/:id", authenticateUser, reviewController.deleteReview);

const reviewRouter = express.Router();
reviewRouter.use("/reviews", router);

module.exports = reviewRouter;
