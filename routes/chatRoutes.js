const express = require("express");
const chatController = require("../controllers/chatController");
const { authenticateUser } = require("../middleware/AuthMiddleware");

const router = express.Router();

router.post("/init", chatController.initChat);
router.get("/my-chats/:userId", chatController.getChatsForUser);
router.get("/:chatId", chatController.getChatHistory);
router.get("/help-topics/:userId", chatController.getHelpTopics);
router.post("/send/:userId", chatController.sendMessageRest);


const chatRouter = express.Router();
chatRouter.use("/chat", router);
module.exports = chatRouter;