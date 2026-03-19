const express = require('express'); 
const PaymentController = require('../controllers/paymentsController');
const { authenticateUser } = require('../middleware/AuthMiddleware');

const router = express.Router();

// 🔥 Маршруты для управления адресами пользователя
router.get('/:id', authenticateUser, PaymentController.getUserPayments); // Получить все адреса
router.post('/:id', authenticateUser, PaymentController.addPayment); // Добавить новый адрес
router.put('/:id', authenticateUser, PaymentController.updatePaymentDetails); // Редактировать адрес
// router.delete('/address/:id', authenticateUser, UserController.deleteAddress); // Удалить адрес

const paymentRouter = express.Router();
paymentRouter.use("/payment", router);

module.exports = paymentRouter;
