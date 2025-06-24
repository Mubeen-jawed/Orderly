/////////////////////////////////////////////////////////////////
// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const axios = require("axios");
// const bodyParser = require("body-parser");

// // Load env variables
// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // POST /api/orders - handle order and send to Telegram
// app.post("/api/orders", async (req, res) => {
//   const { name, address, items, total } = req.body;

//   if (!name || !address || !items || items.length === 0) {
//     return res.status(400).json({ error: "Missing order details" });
//   }

//   // Format message
//   const message = `
// 🛒 *New Food Order Received!*

// 👤 *Name:* ${name}
// 🏠 *Address:* ${address}

// 🍽️ *Items:*
// ${items.map((item) => `- ${item.name} (Rs ${item.price})`).join("\n")}

// 💰 *Total:* Rs ${total}
// `;

//   try {
//     await axios.post(
//       `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
//       {
//         chat_id: process.env.TELEGRAM_CHAT_ID,
//         text: message,
//         parse_mode: "Markdown",
//       }
//     );

//     return res.status(200).json({ message: "Order sent to Telegram" });
//   } catch (error) {
//     console.error("Telegram send failed:", error.message);
//     return res.status(500).json({ error: "Failed to send order to Telegram" });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
/////////////////////////////////////////////////////////////////////////

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // stop the server if DB fails
  });

// Define Mongoose Schema
const orderSchema = new mongoose.Schema({
  name: String,
  address: String,
  items: [
    {
      id: Number,
      name: String,
      price: Number,
    },
  ],
  total: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);

// Handle incoming orders
app.post("/api/orders", async (req, res) => {
  const { name, address, items, total } = req.body;

  if (!name || !address || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing order details" });
  }

  try {
    // Save order to MongoDB
    const newOrder = new Order({ name, address, items, total });
    await newOrder.save();

    // Prepare Telegram message
    const message = `
🛒 *New Food Order Received!*

👤 *Name:* ${name}
🏠 *Address:* ${address}

🍽️ *Items:*
${items.map((item) => `- ${item.name} (Rs ${item.price})`).join("\n")}

💰 *Total:* Rs ${total}
📅 *Time:* ${new Date().toLocaleString()}
`;

    // Send to Telegram bot
    // await axios.post(
    //   `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    //   {
    //     chat_id: process.env.TELEGRAM_CHAT_ID,
    //     text: message,
    //     parse_mode: 'Markdown',
    //   }
    // );

    return res
      .status(200)
      .json({ message: "Order saved and sent to Telegram" });
  } catch (error) {
    console.error("❌ Error processing order:", error.message);
    return res.status(500).json({ error: "Failed to save/send order" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
