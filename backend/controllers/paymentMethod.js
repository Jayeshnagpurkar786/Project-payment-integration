const { pool } = require("../models/database");
const Razorpay = require("razorpay");
const fs = require("fs");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Function to read data from JSON file
// const readData = () => {
//   if (fs.existsSync("orders.json")) {
//     const data = fs.readFileSync("orders.json");
//     return JSON.parse(data);
//   }
//   return [];
// };
// // Function to write data to JSON file
// const writeData = (data) => {
//   fs.writeFileSync("orders.json", JSON.stringify(data, null, 2));
// };

// // Initialize orders.json if it doesn't exist
// if (!fs.existsSync("orders.json")) {
//   writeData([]);
// }

//old Route to handle order creation

// async function createPayment(req, res) {
//   try {
//     const { amount } = req.body;
//     const options = {
//       amount: amount*100, // Convert amount to paise
//       // currency,
//       // receipt,
//       // notes,
//     };

//     const order = await razorpay.orders.create(options);

//     // Read current orders, add new order, and write back to the file
//     const orders = readData();
//     orders.push({
//       order_id: order.id,
//       amount: order.amount,
//       currency: order.currency,
//       receipt: order.receipt,
//       status: "created",
//     });
//     writeData(orders);

//     res.status(200).json(order); // Send order details to frontend, including order ID
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to create Razorpay order" });
//   }
// }
//old verify payment
// async function verifyPayment(req, res) {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//     req.body;
//   const body = razorpay_order_id + "|" + razorpay_payment_id;

//   try {
//     const isValidSignature = validateWebhookSignature(
//       body,
//       razorpay_signature,
//          process.env.RAZORPAY_KEY_SECRET,
//       // "baqn54chqOz7hqwMAzE4n8XS"
//     );

//     if (isValidSignature) {
//       // Update the order with payment details
//       const orders = readData();
//       const order = orders.find((o) => o.order_id === razorpay_order_id);
//       if (order) {
//         order.status = "paid";
//         order.payment_id = razorpay_payment_id;
//         writeData(orders);
//       }

//       res.status(200).json({ status: "ok" });
//       console.log("Payment verification successful");
//     } else {
//       res.status(400).json({ status: "verification_failed" });
//       console.log("Payment verification failed");
//     }
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ status: "error", message: "Error verifying payment" });
//   }
// }

//Create Payment
async function createPayment(req, res) {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, 
      currency: "INR", 
      receipt: `receipt_${Date.now()}`, 
      notes: {}, 
    };

    const order = await razorpay.orders.create(options);

    const queryText = `
      INSERT INTO orders (order_id, amount, currency, receipt, status)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    
    const values = [order.id, amount, order.currency, order.receipt, "created"];
    await pool.query(queryText, values);

    res.status(200).json(order); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
}

//Verify Payment
async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  try {
    const isValidSignature = validateWebhookSignature(
      body,
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET,
    );

    if (isValidSignature) {
     
      const queryText = `
        UPDATE orders
        SET status = $1, payment_id = $2
        WHERE order_id = $3 RETURNING *
      `;
      const values = ["paid", razorpay_payment_id, razorpay_order_id];
      const dbRes = await pool.query(queryText, values);

      if (dbRes.rowCount > 0) {
        res.status(200).json({ status: "ok" });
        console.log("Payment verification successful");
      } else {
        res.status(400).json({ status: "order_not_found" });
        console.log("Order not found for payment verification");
      }
    } else {
      res.status(400).json({ status: "verification_failed" });
      console.log("Payment verification failed");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Error verifying payment" });
  }
}

//Refund
async function paymentRefund(req, res) {
  const { paymentId, amount } = req.body;

  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100,
    });

    res.status(200).json({
      message: "Refund initiated successfully",
      refund,
    });
  } catch (error) {
    console.error("Error initiating refund:", error);
    res.status(500).json({
      message: "Failed to initiate refund",
      error: error.message,
    });
  }
}

//Fetch All Orders Details
async function getAllOrders(req, res) {
  try {
    const queryText = 'SELECT * FROM orders ORDER BY id DESC'; 
    const dbRes = await pool.query(queryText);

    res.status(200).json(dbRes.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}

module.exports = {
  verifyPayment,
  createPayment,
  paymentRefund,
  getAllOrders
};
