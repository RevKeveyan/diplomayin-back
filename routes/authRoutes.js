const express = require('express');
const AuthController = require('../controllers/authController');
const router = express.Router();

router.post('/reset-password', AuthController.resetPassword)
router.post('/get-code', AuthController.sendPasswordResetCode)
router.get("/me", AuthController.getAuthenticatedUser);
router.put('/login', AuthController.login)
router.put('/logout', AuthController.logout)


const authRouter = express.Router();
authRouter.use("/auth", router);

module.exports = authRouter;
