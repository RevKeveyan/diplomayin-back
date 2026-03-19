const sendEmail = require("../mailer/send-mail");
const Chat = require("../models/Chat");

class ChatController {
  initChat = async (req, res) => {
    const { buyerId, sellerId, productId } = req.body;

    try {
      if (buyerId === sellerId) {
        return res.status(400).json({ message: "You can't message yourself." });
      }

      let chat = await Chat.findOne({ buyerId, sellerId, productId });

      if (!chat) {
        chat = await Chat.create({ buyerId, sellerId, productId, messages: [] });
      }

      res.status(200).json({ chatId: chat._id });
    } catch (err) {
      res.status(500).json({ message: "Error initializing chat", error: err.message });
    }
  };

  getChatsForUser = async (req, res) => {
    const userId = req.params.userId;

    try {
      const chats = await Chat.find({
        $or: [{ buyerId: userId }, { sellerId: userId }],
      })
        .populate("messages.senderId", "firstName avatar")
        .populate("productId", "name")
        .sort({ updatedAt: -1 });

        const chatList = chats.map((chat) => {
          const isBuyer = chat.buyerId?._id?.toString() === userId;
          const otherUser = isBuyer ? chat.sellerId?.firstName : chat.buyerId?.firstName;
          const productName = chat.productId ? chat.productId.name : "Unknown product";
        
          return {
            chatId: chat._id,
            // otherUser: otherUser || "Unknown user",
            productName,
            lastMessage: chat.messages.at(-1)?.text || "",
            lastMessageTime: chat.updatedAt,
          };
        });
        

      res.status(200).json({ chats: chatList });
    } catch (err) {
      console.log(err);
      
      res.status(500).json({ message: "Failed to load chats", error: err.message });
    }
  };

  getChatHistory = async (req, res) => {
    const { chatId } = req.params;
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return res.status(404).json({ message: "Chat not found" });

      res.status(200).json({ messages: chat.messages });
    } catch (err) {
      res.status(500).json({ message: "Failed to retrieve chat", error: err.message });
    }
  };

  getHelpTopics = (req, res) => {
    const topics = [
      "Where is my order?",
      "I want to cancel the purchase",
      "How to use the product?",
      "Item is damaged",
      "Need a return",
    ];

    res.status(200).json({ topics });
  };

  sendMessageRest = async (req, res) => {
    const { chatId, senderId, text } = req.body;

    try {
      const chat = await Chat.findById(chatId)
        .populate("buyerId", "firstName email")
        .populate("sellerId", "firstName email")
        .populate("productId", "name");

      if (!chat) return res.status(404).json({ message: "Chat not found" });

      const newMessage = { senderId, text, timestamp: new Date() };
      chat.messages.push(newMessage);
      chat.updatedAt = new Date();
      await chat.save();

      // 📧 Email notification to the other user
      const isBuyer = senderId.toString() === chat.buyerId._id.toString();
      const receiver = isBuyer ? chat.sellerId : chat.buyerId;

      const subject = "New message in chat";
      const emailText = `
Hello, ${receiver.name}!

You have received a new message regarding the product "${chat.productId.name}":

"${text}"

Go to the chat to reply.

Best regards,  
Your ShopLink platform.
      `;

      await sendEmail(receiver.email, subject, emailText);

      res.status(200).json({ message: "Message saved and email sent" });
    } catch (err) {
      res.status(500).json({ message: "Error", error: err.message });
    }
  };
}

module.exports = new ChatController();
