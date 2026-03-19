const express = require('express'); 
const UserController = require('../controllers/userController');
const { authenticateUser } = require('../middleware/AuthMiddleware');
const { checkRole } = require('../middleware/AdminMiddleware');
const { upload } = require('../middleware/fileMidlleware1');

const router = express.Router();

// 🔥 Маршруты для управления пользователями
router.get('/:id', authenticateUser, UserController.getUserById);
router.post('/', UserController.register);
router.post('/create', authenticateUser, checkRole('admin'), UserController.create);
router.put('/:id', authenticateUser, UserController.edit);
router.put('/payment', authenticateUser, UserController.updatePaymentDetails);
router.put('/:id/change-password', authenticateUser, UserController.updatePassword);
router.delete('/delete', authenticateUser, UserController.delete);
router.get('/verify', UserController.verify);
router.put("/:id/avatar", upload.single("avatar"), UserController.updateAvatar);

module.exports = router;

const userRouter = express.Router();
userRouter.use("/user", router);

module.exports = userRouter;
