const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// =======================================================
// MIDDLEWARE
// =======================================================

app.use(cors());
app.use(express.json());

// =======================================================
// MONGODB
// =======================================================

const client = new MongoClient(process.env.MONGO_URI, {
  family: 4,
  tls: true,
  serverSelectionTimeoutMS: 15000,
});

let db;
let usersCollection;
let productsCollection;
let ordersCollection;
let deliveryPartnersCollection;

// =======================================================
// GMAIL / NODEMAILER
// =======================================================

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER.trim(),
    pass: process.env.EMAIL_PASS.replace(/\s+/g, "").trim(),
  },
});

transporter.verify((error) => {
  if (error) {
    console.log("❌ SERVER GMAIL VERIFY ERROR:", error.message);
  } else {
    console.log("✅ SERVER GMAIL VERIFY OK");
  }
});

// =======================================================
// HELPERS
// =======================================================

function cleanEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

// =======================================================
// FORGOT PASSWORD OTP
// =======================================================

const otpStore = new Map();

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailValue = cleanEmail(email);

    const user = await usersCollection.findOne({
      email: emailValue,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not registered",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    otpStore.set(emailValue, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailValue,
      subject: "GraminMart Password Reset OTP",
      text:
        `Your GraminMart password reset OTP is ${otp}.\n\n` +
        `This OTP is valid for 10 minutes.`,
    });

    console.log("OTP sent successfully to:", emailValue);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
});

// =======================================================
// BASIC ROUTES
// =======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GraminMart Backend is running",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
  });
});

// =======================================================
// REGISTER
// =======================================================

app.post("/api/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      mobile,
      phone,
      city,
      address,
      role,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const emailValue = cleanEmail(email);

    const existingUser = await usersCollection.findOne({
      email: emailValue,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    let userRole = "customer";

    if (
      role === "seller" ||
      role === "shop_owner" ||
      role === "delivery_partner" ||
      role === "delivery" ||
      role === "admin"
    ) {
      userRole = role;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      name: String(name).trim(),
      email: emailValue,
      password: hashedPassword,
      mobile: String(mobile || phone || "").trim(),
      city: String(city || "").trim(),
      address: String(address || "").trim(),
      role: userRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(user);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        _id: result.insertedId,
        id: result.insertedId,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
});

// =======================================================
// LOGIN
// =======================================================

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const emailValue = cleanEmail(email);

    const user = await usersCollection.findOne({
      email: emailValue,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// =======================================================
// MAKE ADMIN
// =======================================================

app.post("/api/make-admin", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailValue = cleanEmail(email);

    const result = await usersCollection.updateOne(
      { email: emailValue },
      {
        $set: {
          role: "admin",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User is now admin",
    });
  } catch (error) {
    console.error("MAKE ADMIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to make admin",
      error: error.message,
    });
  }
});

console.log("✅ MAKE ADMIN ROUTE REGISTERED");

// =======================================================
// MAKE SELLER
// =======================================================

app.post("/api/make-seller", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!usersCollection) {
      return res.status(503).json({
        success: false,
        message: "Database is not ready yet",
      });
    }

    const emailValue = cleanEmail(email);

    const result = await usersCollection.updateOne(
      { email: emailValue },
      {
        $set: {
          role: "seller",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User is now a seller",
    });
  } catch (error) {
    console.error("MAKE SELLER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to make seller",
      error: error.message,
    });
  }
});

console.log("✅ MAKE SELLER ROUTE REGISTERED");

// =======================================================
// TEST SELLER ROUTE
// =======================================================

app.post("/api/test-seller-route", (req, res) => {
  res.json({
    success: true,
    message: "SELLER TEST ROUTE WORKING",
  });
});

console.log("✅ TEST SELLER ROUTE REGISTERED");

// =======================================================
// MAKE DELIVERY PARTNER
// =======================================================

app.post("/api/make-delivery-partner", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailValue = cleanEmail(email);

    const result = await usersCollection.updateOne(
      { email: emailValue },
      {
        $set: {
          role: "delivery_partner",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User is now delivery partner",
    });
  } catch (error) {
    console.error("MAKE DELIVERY PARTNER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to make delivery partner",
      error: error.message,
    });
  }
});

console.log("✅ MAKE DELIVERY PARTNER ROUTE REGISTERED");

// =======================================================
// GET ALL USERS
// =======================================================

app.get("/api/users", async (req, res) => {
  try {
    const users = await usersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const safeUsers = users.map((user) => ({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      phone: user.phone,
      city: user.city,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.json({
      success: true,
      users: safeUsers,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

// =======================================================
// GET SINGLE USER
// =======================================================

app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await usersCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        phone: user.phone,
        city: user.city,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("GET USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
});

// =======================================================
// UPDATE USER ROLE
// =======================================================

app.put("/api/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const allowedRoles = [
      "customer",
      "seller",
      "shop_owner",
      "delivery_partner",
      "delivery",
      "admin",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("UPDATE ROLE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
});

// =======================================================
// DELETE USER
// =======================================================

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
});

// =======================================================
// PRODUCTS - GET ALL
// =======================================================

app.get("/api/products", async (req, res) => {
  try {
    const products = await productsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// =======================================================
// PRODUCTS - GET SINGLE
// =======================================================

app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await productsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
});

// =======================================================
// SELLER PRODUCTS
// =======================================================

app.get("/api/products/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;

    let query = {
      sellerId,
    };

    if (isValidObjectId(sellerId)) {
      query = {
        $or: [
          { sellerId },
          { sellerId: new ObjectId(sellerId) },
        ],
      };
    }

    const products = await productsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("GET SELLER PRODUCTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch seller products",
      error: error.message,
    });
  }
});

// =======================================================
// ADD PRODUCT
// =======================================================

app.post("/api/products", async (req, res) => {
  try {
    const {
      name,
      title,
      description,
      price,
      mrp,
      category,
      image,
      stock,
      quantity,
      sellerId,
      sellerName,
      sellerEmail,
      shopName,
    } = req.body;

    if (!name && !title) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (price === undefined || price === null || price === "") {
      return res.status(400).json({
        success: false,
        message: "Product price is required",
      });
    }

    const product = {
      name: name || title,
      title: title || name,
      description: description || "",
      price: Number(price),

      mrp:
        mrp !== undefined && mrp !== ""
          ? Number(mrp)
          : Number(price),

      category: category || "General",
      image: image || "",

      stock:
        stock !== undefined && stock !== ""
          ? Number(stock)
          : Number(quantity || 0),

      quantity:
        quantity !== undefined && quantity !== ""
          ? Number(quantity)
          : Number(stock || 0),

      sellerId: sellerId || null,
      sellerName: sellerName || "",
      sellerEmail: sellerEmail || "",
      shopName: shopName || "",

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await productsCollection.insertOne(product);

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: {
        ...product,
        _id: result.insertedId,
        id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
});

// =======================================================
// UPDATE PRODUCT
// =======================================================

app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }

    if (updateData.stock !== undefined) {
      updateData.stock = Number(updateData.stock);
    }

    if (updateData.quantity !== undefined) {
      updateData.quantity = Number(updateData.quantity);
    }

    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: updateData,
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
});

// =======================================================
// DELETE PRODUCT
// =======================================================

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const result = await productsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
});

// =======================================================
// GET ALL ORDERS - ADMIN
// =======================================================

app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await ordersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("GET ADMIN ORDERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

// =======================================================
// GET USER ORDERS
// =======================================================

app.get("/api/orders/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const orders = await ordersCollection
      .find({
        $or: [
          { userId: new ObjectId(userId) },
          { userId: userId },
          { customerId: new ObjectId(userId) },
          { customerId: userId },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("GET USER ORDERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user orders",
      error: error.message,
    });
  }
});

// =======================================================
// CREATE ORDER
// IMPORTANT: SELLER INFORMATION IS SAVED HERE
// =======================================================

app.post("/api/orders", async (req, res) => {
  try {
    const orderData = req.body;

    if (
      !orderData ||
      typeof orderData !== "object"
    ) {
      return res.status(400).json({
        success: false,
        message: "Order data is required",
      });
    }

    // ==========================================
    // CALCULATE ORDER TOTAL
    // ==========================================

    const items = Array.isArray(orderData.items)
      ? orderData.items
      : [];

    const calculatedTotal = items.reduce(
      (sum, item) => {
        const price = Number(
          item.price ??
          item.unitPrice ??
          item.productPrice ??
          0
        );

        const quantity = Number(
          item.quantity ?? 1
        );

        return sum + price * quantity;
      },
      0
    );

    // ==========================================
    // CREATE ORDER
    // ==========================================

    const order = {
      ...orderData,

      // Always use calculated total
      totalAmount: calculatedTotal,
      total: calculatedTotal,

      status:
        orderData.status || "Pending",

      deliveryPartnerId: null,
      deliveryPartnerName: "",
      deliveryPartnerMobile: "",

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result =
      await ordersCollection.insertOne(order);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: {
        ...order,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
});

// =======================================================
// GET SINGLE ORDER
// =======================================================

app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await ordersCollection.findOne({
      _id: new ObjectId(orderId),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("GET ORDER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
});

// =======================================================
// SELLER ORDERS
// =======================================================

app.get("/api/orders/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller ID is required",
      });
    }

    const sellerQueries = [
      { sellerId: sellerId },
    ];

    if (isValidObjectId(sellerId)) {
      sellerQueries.push({
        sellerId: new ObjectId(sellerId),
      });
    }

    const orders = await ordersCollection
      .find({
        $or: sellerQueries,
      })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(
      `Seller ${sellerId} orders found:`,
      orders.length
    );

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("GET SELLER ORDERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch seller orders",
      error: error.message,
    });
  }
});

// =======================================================
// UPDATE SELLER ORDER STATUS
// =======================================================

app.put(
  "/api/orders/:orderId/seller-status",
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, sellerId } = req.body;

      if (!isValidObjectId(orderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      if (!sellerId) {
        return res.status(400).json({
          success: false,
          message: "Seller ID is required",
        });
      }

      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Assigned",
        "Out for Delivery",
        "Delivered",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
      }

      const order = await ordersCollection.findOne({
        _id: new ObjectId(orderId),
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Seller ownership check
      if (
        order.sellerId &&
        String(order.sellerId) !== String(sellerId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own orders",
        });
      }

      await ordersCollection.updateOne(
        {
          _id: new ObjectId(orderId),
        },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        }
      );

      res.json({
        success: true,
        message: "Order status updated successfully",
      });
    } catch (error) {
      console.error(
        "SELLER ORDER STATUS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to update order status",
        error: error.message,
      });
    }
  }
);

// =======================================================
// UPDATE ORDER STATUS - ADMIN
// =======================================================

app.put(
  "/api/admin/orders/:orderId/status",
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!isValidObjectId(orderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Assigned",
        "Out for Delivery",
        "Delivered",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
      }

      const result = await ordersCollection.updateOne(
        {
          _id: new ObjectId(orderId),
        },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        message: "Order status updated successfully",
      });
    } catch (error) {
      console.error(
        "UPDATE ORDER STATUS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to update order status",
        error: error.message,
      });
    }
  }
);

// =======================================================
// GET ALL DELIVERY PARTNERS - ADMIN
// =======================================================

app.get(
  "/api/admin/delivery-partners",
  async (req, res) => {
    try {
      const partners =
        await deliveryPartnersCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

      res.json({
        success: true,
        partners,
      });
    } catch (error) {
      console.error(
        "GET DELIVERY PARTNERS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to fetch delivery partners",
        error: error.message,
      });
    }
  }
);

// =======================================================
// ADD DELIVERY PARTNER - ADMIN
// =======================================================

app.post(
  "/api/admin/delivery-partners",
  async (req, res) => {
    try {
      const { name, mobile, city } = req.body;

      if (!name || !mobile || !city) {
        return res.status(400).json({
          success: false,
          message:
            "Name, mobile and city are required",
        });
      }

      const partner = {
        name: String(name).trim(),
        mobile: String(mobile).trim(),
        city: String(city).trim(),
        status: "Active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result =
        await deliveryPartnersCollection.insertOne(
          partner
        );

      res.status(201).json({
        success: true,
        message:
          "Delivery partner added successfully",
        partner: {
          ...partner,
          _id: result.insertedId,
        },
      });
    } catch (error) {
      console.error(
        "ADD DELIVERY PARTNER ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to add delivery partner",
        error: error.message,
      });
    }
  }
);

// =======================================================
// UPDATE DELIVERY PARTNER STATUS
// =======================================================

app.put(
  "/api/admin/delivery-partners/:id/status",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid delivery partner ID",
        });
      }

      if (!["Active", "Inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const result =
        await deliveryPartnersCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              status,
              updatedAt: new Date(),
            },
          }
        );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Delivery partner not found",
        });
      }

      res.json({
        success: true,
        message:
          "Delivery partner status updated",
      });
    } catch (error) {
      console.error(
        "UPDATE PARTNER STATUS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update partner status",
        error: error.message,
      });
    }
  }
);

// =======================================================
// DELETE DELIVERY PARTNER
// =======================================================

app.delete(
  "/api/admin/delivery-partners/:id",
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid delivery partner ID",
        });
      }

      const result =
        await deliveryPartnersCollection.deleteOne(
          {
            _id: new ObjectId(id),
          }
        );

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Delivery partner not found",
        });
      }

      res.json({
        success: true,
        message:
          "Delivery partner deleted successfully",
      });
    } catch (error) {
      console.error(
        "DELETE DELIVERY PARTNER ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete delivery partner",
        error: error.message,
      });
    }
  }
);

// =======================================================
// ASSIGN DELIVERY PARTNER TO ORDER
// =======================================================

app.put(
  "/api/admin/orders/:orderId/assign-delivery",
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { partnerId } = req.body;

      if (
        !isValidObjectId(orderId) ||
        !isValidObjectId(partnerId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order or partner ID",
        });
      }

      const partner =
        await deliveryPartnersCollection.findOne({
          _id: new ObjectId(partnerId),
        });

      if (!partner) {
        return res.status(404).json({
          success: false,
          message:
            "Delivery partner not found",
        });
      }

      const result =
        await ordersCollection.updateOne(
          {
            _id: new ObjectId(orderId),
          },
          {
            $set: {
              deliveryPartnerId: partner._id,
              deliveryPartnerName: partner.name,
              deliveryPartnerMobile: partner.mobile,
              status: "Assigned",
              updatedAt: new Date(),
            },
          }
        );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        message:
          "Delivery partner assigned successfully",
      });
    } catch (error) {
      console.error(
        "ASSIGN DELIVERY ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to assign delivery partner",
        error: error.message,
      });
    }
  }
);

// =======================================================
// 404 ROUTE
// IMPORTANT: THIS MUST BE LAST
// =======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =======================================================
// START SERVER
// =======================================================

async function startServer() {
  try {
    await client.connect();

    console.log("MongoDB Connected Successfully");

    db = client.db();

    console.log("Database:", db.databaseName);

    usersCollection = db.collection("users");
    productsCollection = db.collection("products");
    ordersCollection = db.collection("orders");
    deliveryPartnersCollection =
      db.collection("deliveryPartners");

    console.log(
      "Collections initialized: users, products, orders, deliveryPartners"
    );

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `GraminMart Backend running on http://localhost:${PORT}`
      );

      console.log("✅ MAKE ADMIN ROUTE REGISTERED");
      console.log("✅ MAKE SELLER ROUTE REGISTERED");
      console.log(
        "✅ MAKE DELIVERY PARTNER ROUTE REGISTERED"
      );
      console.log("✅ SELLER ROUTES REGISTERED");
      console.log(
        "✅ DELIVERY PARTNER ROUTES REGISTERED"
      );
      console.log("✅ ORDER STATUS ROUTE REGISTERED");
    });
  } catch (error) {
    console.error(
      "MongoDB Connection Failed:",
      error
    );

    process.exit(1);
  }
}

// =======================================================
// RUN SERVER
// =======================================================

startServer();