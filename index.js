const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const connectDB = require("./db");
const Order = require("./models/Order");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();

// Send Telegram message
const sendTelegramMessage = async (order) => {
  const itemList = order.items
    .map((item) => `- ${item.name} - Rs ${item.price}`)
    .join("\n");

  const message = `🛒 New Order Received!\n\nCustomer: ${order.name}\nAddress: ${order.address}\n\nItems:\n${itemList}\n\nTotal: Rs ${order.total}`;

  try {
    const res = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
      }
    );
    console.log("✅ Telegram message sent:", res.data);
  } catch (err) {
    console.error(
      "❌ Failed to send Telegram message:",
      err.response?.data || err.message
    );
  }
};

// Order route
app.post("/api/orders", async (req, res) => {
  try {
    console.log("Order received:", req.body);
    const order = new Order(req.body);
    await order.save();
    await sendTelegramMessage(order);
    res.status(201).json({ message: "Order placed and message sent ✅" });
  } catch (err) {
    console.error("❌ Error placing order:", err);
    res.status(500).json({ error: "Something went wrong ❌" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
