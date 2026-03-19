const express = require("express");
const { authenticateUser, authenticateAdmin } = require("../middleware/AuthMiddleware");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.get("/user-orders", authenticateUser, orderController.getUserOrders);
router.get("/seller/:id", authenticateUser, orderController.getOrdersBySellerId)

router.get("/:id", authenticateUser, orderController.getOrderById)

router.post("/create", authenticateUser, orderController.createOrder);
router.post("/offer", authenticateUser, orderController.offerOrder);

router.put("/:id/update-status", authenticateUser, orderController.updateOrderStatus);

router.put("/:id/cancel", authenticateUser, orderController.cancelOrder);

router.put("/:id/confirm-received", authenticateUser, orderController.confirmOrderReceived);

router.get("/all-orders", authenticateUser, orderController.getAllOrders);

const orderRouter = express.Router();
orderRouter.use("/orders", router);

module.exports = orderRouter;
