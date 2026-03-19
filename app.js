require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const http = require("http"); // для создания сервера с сокетами
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app); // оборачиваем app в сервер
const io = socketIO(server, {
  cors: { origin: "*" },
});

// Модель чата
const Chat = require("./models/Chat"); // не забудь создать файл модели

// === Middleware ===
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors({ origin: "*" }));

// === MongoDB подключение ===
const directMongoUri = process.env.MONGODB_URI;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbCluster = process.env.DB_CLUSTER;
const dbName = process.env.DB_NAME;
const fallbackUri =
  dbUser && dbPass && dbCluster && dbName
    ? `mongodb+srv://${dbUser}:${encodeURIComponent(dbPass)}@${dbCluster}/${dbName}?retryWrites=true&w=majority`
    : null;
const dbURI = directMongoUri || fallbackUri;
const PORT = process.env.PORT || 5000;

if (!dbURI) {
  throw new Error("MongoDB URI is not configured");
}

mongoose
  .connect(dbURI, {})
  .then(() => console.log("Connected to DB"))
  .catch((error) => {
    console.error("Connection error:", error);
  });

// === Роутеры ===
const productRouter = require("./routes/productRoutes.js");
const authRouter = require("./routes/authRoutes.js");
const userRouter = require("./routes/userRoutes.js");
const cartRouter = require("./routes/cartRoutes.js");
const orderRouter = require("./routes/orderRoutes.js");
const reviewRouter = require("./routes/reviewRoutes.js");
const offerRouter = require("./routes/offerRoutes.js");
const addressRouter = require("./routes/addressRoutes.js");
const paymentRouter = require("./routes/paymensRoutes.js");
const chatRouter = require("./routes/chatRoutes.js");
const sendEmail = require("./mailer/send-mail.js");

app.use(authRouter);
app.use(userRouter);
app.use(productRouter);
app.use(cartRouter);
app.use(orderRouter);
app.use(reviewRouter);
app.use(addressRouter);
app.use(paymentRouter);
app.use(offerRouter);
app.use(chatRouter);

io.on("connection", (socket) => {
  console.log("🔌 Пользователь подключён");

  socket.on("joinChat", ({ chatId }) => {
    socket.join(`chat:${chatId}`);
    console.log(`🟢 user connect to chat:${chatId}`);
  });

  socket.on("sendMessage", ({ chatId, senderId, text }) => {
    const newMessage = { chatId, senderId, text, timestamp: new Date() };
    io.to(`chat:${chatId}`).emit("receiveMessage", newMessage); 
  });
  socket.on("disconnect", () => {
    console.log("❌ user left the chat");
  });
});
server.listen(PORT, (err) => {
  if (err) console.log(err);
  console.log(`${PORT}`);
});
