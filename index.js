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
  restaurantName: String,
  customerDetails: {
    name: String,
    phone: String,
    address: String,
  },
  items: [
    {
      id: Number,
      name: String,
      description: String,
      price: Number,
      quantity: Number,
      subtotal: Number,
    },
  ],
  pricing: {
    subtotal: Number,
    deliveryFee: Number,
    platformFee: Number,
    total: Number,
  },
  orderDate: String, // keep ISO string format
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);

// Handle incoming orders
app.post("/api/orders", async (req, res) => {
  const { restaurantName, customerDetails, items, pricing, orderDate } =
    req.body;

  // Basic validation
  if (
    !customerDetails?.name ||
    !customerDetails?.address ||
    !items ||
    items.length === 0 ||
    !pricing?.total
  ) {
    return res.status(400).json({ error: "Missing order details" });
  }

  try {
    // Save full rich order
    const newOrder = new Order({
      restaurantName,
      customerDetails,
      items,
      pricing,
      orderDate,
    });
    await newOrder.save();

    // Prepare Telegram message
    const message = `
*🛒 New Food Order!*

🍽️ *Restaurant:* ${restaurantName}
👤 *Customer:* ${customerDetails.name}
📞 *Phone:* ${customerDetails.phone}
🏠 *Address:* ${customerDetails.address}

*Items:*
${items
  .map((item) => `- ${item.name} x${item.quantity} (Rs ${item.subtotal})`)
  .join("\n")}

💵 *Subtotal:* Rs ${pricing.subtotal}
🚚 *Delivery Fee:* Rs ${pricing.deliveryFee}
⚙️ *Platform Fee:* Rs ${pricing.platformFee}
💰 *Total:* Rs ${pricing.total}

📅 *Order Time:* ${new Date().toLocaleString()}
`;

    // Send to Telegram
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }
    );

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
