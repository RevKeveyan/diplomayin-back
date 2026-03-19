const express = require('express'); 
const AddressController = require('../controllers/addressController');
const { authenticateUser } = require('../middleware/AuthMiddleware');

const router = express.Router();

// 🔥 Маршруты для управления адресами пользователя
router.get('/:id', authenticateUser, AddressController.getUserAddresses); // Получить все адреса
router.post('/:id', authenticateUser, AddressController.addAddress); // Добавить новый адрес
router.put('/:id', authenticateUser, AddressController.updateAddress); // Редактировать адрес
// router.delete('/address/:id', authenticateUser, UserController.deleteAddress); // Удалить адрес

const addressRouter = express.Router();
addressRouter.use("/address", router);

module.exports = addressRouter;
