const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");
require("dotenv").config();
require("dns").setServers(["8.8.8.8"]);

const app = express();
const PORT = process.env.PORT || 5000;

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());
app.use(express.json());

// =========================================================
// MONGODB
// =========================================================

if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI is missing in .env");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGO_URI, {
  family: 4,
  tls: true,
  serverSelectionTimeoutMS: 15000,
});

// =========================================================
// COLLECTIONS
// =========================================================

let usersCollection;
let productsCollection;
let ordersCollection;
let deliveryPartnersCollection;

// =========================================================
// OTP
// =========================================================

const otpStore = new Map();

// =========================================================
// GMAIL
// =========================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =========================================================
// HELPERS
// =========================================================

function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

function cleanEmail(email) {
  return String(email || "")
    .toLowerCase()
    .trim();
}

// =========================================================
// BASIC ROUTES
// =========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GraminMart Backend is Running",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "GraminMart API is working",
  });
});

// =========================================================
// MAKE DELIVERY PARTNER
// IMPORTANT: Register outside startServer()
// =========================================================

app.post("/api/make-delivery-partner", async (req, res) => {
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

    return res.json({
      success: true,
      message: "User is now a delivery partner",
    });
  } catch (error) {
    console.error("MAKE DELIVERY PARTNER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to make delivery partner",
      error: error.message,
    });
  }
});

// =========================================================
// START SERVER
// =========================================================

async function startServer() {
  try {
    // =======================================================
    // DATABASE CONNECT
    // =======================================================

    await client.connect();

    const db = client.db("graminmart");

    usersCollection = db.collection("users");
    productsCollection = db.collection("products");
    ordersCollection = db.collection("orders");
    deliveryPartnersCollection =
      db.collection("deliveryPartners");

    await db.command({ ping: 1 });

    console.log("MongoDB Connected Successfully");
    console.log("Database: graminmart");
    console.log(
      "Collections initialized: users, products, orders, deliveryPartners"
    );

    // =======================================================
    // REGISTER
    // =======================================================

    app.post("/api/register", async (req, res) => {
      try {
        const {
          name,
          mobile,
          email,
          password,
          role,
        } = req.body;

        if (!name || !email || !password) {
          return res.status(400).json({
            success: false,
            message:
              "Name, email and password are required",
          });
        }

        const cleanName = String(name).trim();

        const cleanMobile = mobile
          ? String(mobile).trim()
          : "";

        const emailValue = cleanEmail(email);

        const existingUser =
          await usersCollection.findOne({
            $or: [
              { email: emailValue },
              ...(cleanMobile
                ? [{ mobile: cleanMobile }]
                : []),
            ],
          });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message:
              "Email or mobile already registered",
          });
        }

        const hashedPassword = await bcrypt.hash(
          String(password),
          10
        );

        let userRole = "customer";

        if (
          role === "seller" ||
          role === "shop_owner" ||
          role === "delivery_partner" ||
          role === "delivery"
        ) {
          userRole = role;
        }

        const newUser = {
          name: cleanName,
          mobile: cleanMobile,
          email: emailValue,
          password: hashedPassword,
          role: userRole,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result =
          await usersCollection.insertOne(newUser);

        return res.status(201).json({
          success: true,
          message: "Registration successful",
          userId: result.insertedId,
        });
      } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
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
        const {
          email,
          password,
        } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message:
              "Email and password are required",
          });
        }

        const emailValue = cleanEmail(email);

        const user =
          await usersCollection.findOne({
            email: emailValue,
          });

        if (!user) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }

        const passwordMatch =
          await bcrypt.compare(
            String(password),
            user.password
          );

        if (!passwordMatch) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }

        return res.json({
          success: true,
          message: "Login successful",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile || "",
            role: user.role || "customer",
          },
        });
      } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
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

        const result =
          await usersCollection.updateOne(
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

        return res.json({
          success: true,
          message: "User is now admin",
        });
      } catch (error) {
        console.error("MAKE ADMIN ERROR:", error);

        return res.status(500).json({
          success: false,
          message: "Failed to make admin",
          error: error.message,
        });
      }
    });

    // =======================================================
    // ADMIN - USERS
    // =======================================================

    app.get("/api/admin/users", async (req, res) => {
      try {
        const users =
          await usersCollection
            .find({})
            .project({
              password: 0,
            })
            .sort({
              createdAt: -1,
            })
            .toArray();

        return res.json({
          success: true,
          users,
        });
      } catch (error) {
        console.error("GET USERS ERROR:", error);

        return res.status(500).json({
          success: false,
          message: "Failed to fetch users",
          error: error.message,
        });
      }
    });

    // =======================================================
    // FORGOT PASSWORD
    // =======================================================

    app.post(
      "/api/forgot-password",
      async (req, res) => {
        try {
          const { email } = req.body;

          if (!email) {
            return res.status(400).json({
              success: false,
              message: "Email is required",
            });
          }

          const emailValue = cleanEmail(email);

          const user =
            await usersCollection.findOne({
              email: emailValue,
            });

          if (!user) {
            return res.status(404).json({
              success: false,
              message:
                "No account found with this email",
            });
          }

          const otp = Math.floor(
            100000 + Math.random() * 900000
          ).toString();

          otpStore.set(emailValue, {
            otp,
            expiresAt:
              Date.now() + 10 * 60 * 1000,
            verified: false,
          });

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: emailValue,
            subject:
              "GraminMart Password Reset OTP",
            text:
              `Your GraminMart password reset OTP is ${otp}. ` +
              "This OTP is valid for 10 minutes.",
          });

          return res.json({
            success: true,
            message: "OTP sent successfully",
          });
        } catch (error) {
          console.error(
            "FORGOT PASSWORD ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message: "Failed to send OTP",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // VERIFY OTP
    // =======================================================

    app.post("/api/verify-otp", async (req, res) => {
      try {
        const {
          email,
          otp,
        } = req.body;

        if (!email || !otp) {
          return res.status(400).json({
            success: false,
            message:
              "Email and OTP are required",
          });
        }

        const emailValue = cleanEmail(email);

        const savedOtp =
          otpStore.get(emailValue);

        if (!savedOtp) {
          return res.status(400).json({
            success: false,
            message: "OTP not found",
          });
        }

        if (Date.now() > savedOtp.expiresAt) {
          otpStore.delete(emailValue);

          return res.status(400).json({
            success: false,
            message: "OTP expired",
          });
        }

        if (String(otp) !== savedOtp.otp) {
          return res.status(400).json({
            success: false,
            message: "Invalid OTP",
          });
        }

        savedOtp.verified = true;

        return res.json({
          success: true,
          message:
            "OTP verified successfully",
        });
      } catch (error) {
        console.error(
          "VERIFY OTP ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "OTP verification failed",
          error: error.message,
        });
      }
    });

    // =======================================================
    // RESET PASSWORD
    // =======================================================

    app.post(
      "/api/reset-password",
      async (req, res) => {
        try {
          const {
            email,
            newPassword,
          } = req.body;

          if (!email || !newPassword) {
            return res.status(400).json({
              success: false,
              message:
                "Email and new password are required",
            });
          }

          if (
            String(newPassword).length < 6
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Password must be at least 6 characters",
            });
          }

          const emailValue = cleanEmail(email);

          const savedOtp =
            otpStore.get(emailValue);

          if (
            !savedOtp ||
            !savedOtp.verified
          ) {
            return res.status(403).json({
              success: false,
              message:
                "Please verify OTP first",
            });
          }

          const hashedPassword =
            await bcrypt.hash(
              String(newPassword),
              10
            );

          const result =
            await usersCollection.updateOne(
              {
                email: emailValue,
              },
              {
                $set: {
                  password: hashedPassword,
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

          otpStore.delete(emailValue);

          return res.json({
            success: true,
            message:
              "Password reset successfully",
          });
        } catch (error) {
          console.error(
            "RESET PASSWORD ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Password reset failed",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // ADD PRODUCT
    // =======================================================

    app.post("/api/products", async (req, res) => {
      try {
        const {
          name,
          price,
          category,
          image,
          description,
          stock,
          sellerId,
          sellerName,
        } = req.body;

        if (
          !name ||
          price === undefined ||
          !category
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Name, price and category are required",
          });
        }

        const product = {
          name: String(name).trim(),
          price: Number(price),
          category: String(category).trim(),
          image: image
            ? String(image).trim()
            : "",
          description: description
            ? String(description).trim()
            : "",
          stock:
            stock === undefined
              ? 0
              : Number(stock),
          sellerId: sellerId || "",
          sellerName: sellerName || "Admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result =
          await productsCollection.insertOne(
            product
          );

        return res.status(201).json({
          success: true,
          message:
            "Product added successfully",
          product: {
            ...product,
            _id: result.insertedId,
          },
        });
      } catch (error) {
        console.error(
          "ADD PRODUCT ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Failed to add product",
          error: error.message,
        });
      }
    });

    // =======================================================
    // GET ALL PRODUCTS
    // =======================================================

    app.get("/api/products", async (req, res) => {
      try {
        const products =
          await productsCollection
            .find({})
            .sort({
              createdAt: -1,
            })
            .toArray();

        return res.json({
          success: true,
          products,
        });
      } catch (error) {
        console.error(
          "GET PRODUCTS ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to fetch products",
          error: error.message,
        });
      }
    });

    // =======================================================
    // SELLER - OWN PRODUCTS
    // =======================================================

    app.get(
      "/api/products/seller/:sellerId",
      async (req, res) => {
        try {
          const { sellerId } = req.params;

          const products =
            await productsCollection
              .find({
                sellerId: sellerId,
              })
              .sort({
                createdAt: -1,
              })
              .toArray();

          return res.json({
            success: true,
            products,
          });
        } catch (error) {
          console.error(
            "GET SELLER PRODUCTS ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to fetch seller products",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // ADMIN - ALL PRODUCTS
    // =======================================================

    app.get(
      "/api/admin/products",
      async (req, res) => {
        try {
          const products =
            await productsCollection
              .find({})
              .sort({
                createdAt: -1,
              })
              .toArray();

          return res.json({
            success: true,
            products,
          });
        } catch (error) {
          console.error(
            "GET ADMIN PRODUCTS ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to fetch admin products",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // GET SINGLE PRODUCT
    // =======================================================

    app.get(
      "/api/products/:id",
      async (req, res) => {
        try {
          const { id } = req.params;

          if (!isValidObjectId(id)) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid product ID",
            });
          }

          const product =
            await productsCollection.findOne({
              _id: new ObjectId(id),
            });

          if (!product) {
            return res.status(404).json({
              success: false,
              message:
                "Product not found",
            });
          }

          return res.json({
            success: true,
            product,
          });
        } catch (error) {
          console.error(
            "GET PRODUCT ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to fetch product",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // UPDATE PRODUCT
    // =======================================================

    app.put(
      "/api/products/:id",
      async (req, res) => {
        try {
          const { id } = req.params;

          if (!isValidObjectId(id)) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid product ID",
            });
          }

          const updateData = {
            ...req.body,
            updatedAt: new Date(),
          };

          delete updateData._id;

          if (
            updateData.price !==
            undefined
          ) {
            updateData.price =
              Number(updateData.price);
          }

          if (
            updateData.stock !==
            undefined
          ) {
            updateData.stock =
              Number(updateData.stock);
          }

          const result =
            await productsCollection.updateOne(
              {
                _id: new ObjectId(id),
              },
              {
                $set: updateData,
              }
            );

          if (result.matchedCount === 0) {
            return res.status(404).json({
              success: false,
              message:
                "Product not found",
            });
          }

          return res.json({
            success: true,
            message:
              "Product updated successfully",
          });
        } catch (error) {
          console.error(
            "UPDATE PRODUCT ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to update product",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // DELETE PRODUCT
    // =======================================================

    app.delete(
      "/api/products/:id",
      async (req, res) => {
        try {
          const { id } = req.params;

          if (!isValidObjectId(id)) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid product ID",
            });
          }

          const result =
            await productsCollection.deleteOne(
              {
                _id: new ObjectId(id),
              }
            );

          if (result.deletedCount === 0) {
            return res.status(404).json({
              success: false,
              message:
                "Product not found",
            });
          }

          return res.json({
            success: true,
            message:
              "Product deleted successfully",
          });
        } catch (error) {
          console.error(
            "DELETE PRODUCT ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to delete product",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // CREATE ORDER
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
            message:
              "Order data is required",
          });
        }

        const order = {
          ...orderData,
          status:
            orderData.status || "Pending",
          deliveryPartnerId: null,
          deliveryPartnerName: "",
          deliveryPartnerMobile: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result =
          await ordersCollection.insertOne(
            order
          );

        return res.status(201).json({
          success: true,
          message:
            "Order placed successfully",
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
          message:
            "Failed to create order",
          error: error.message,
        });
      }
    });

    // =======================================================
    // GET USER ORDERS
    // =======================================================

    app.get(
      "/api/orders/user/:email",
      async (req, res) => {
        try {
          const email = cleanEmail(
            req.params.email
          );

          const orders =
            await ordersCollection
              .find({
                customerEmail: email,
              })
              .sort({
                createdAt: -1,
              })
              .toArray();

          return res.json({
            success: true,
            orders,
          });
        } catch (error) {
          console.error(
            "GET USER ORDERS ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to fetch user orders",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // ADMIN - ALL ORDERS
    // =======================================================

    app.get(
      "/api/admin/orders",
      async (req, res) => {
        try {
          const orders =
            await ordersCollection
              .find({})
              .sort({
                createdAt: -1,
              })
              .toArray();

          return res.json({
            success: true,
            orders,
          });
        } catch (error) {
          console.error(
            "GET ORDERS ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to fetch orders",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // ADMIN - UPDATE ORDER STATUS
    // =======================================================

    app.put(
      "/api/admin/orders/:orderId/status",
      async (req, res) => {
        try {
          const { orderId } = req.params;
          const { status } = req.body;

          const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Assigned",
            "Out for Delivery",
            "Delivered",
          ];

          if (!status) {
            return res.status(400).json({
              success: false,
              message:
                "Order status is required",
            });
          }

          if (
            !allowedStatuses.includes(status)
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid order status",
            });
          }

          if (!isValidObjectId(orderId)) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid order ID",
            });
          }

          const result =
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

          if (result.matchedCount === 0) {
            return res.status(404).json({
              success: false,
              message: "Order not found",
            });
          }

          return res.json({
            success: true,
            message:
              "Order status updated successfully",
          });
        } catch (error) {
          console.error(
            "UPDATE ORDER STATUS ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to update order status",
            error: error.message,
          });
        }
      }
    );

    console.log(
      "✅ ORDER STATUS ROUTE REGISTERED"
    );

    // =======================================================
    // DELIVERY PARTNERS - GET
    // =======================================================

    app.get(
      "/api/admin/delivery-partners",
      async (req, res) => {
        try {
          const partners =
            await deliveryPartnersCollection
              .find({})
              .sort({
                createdAt: -1,
              })
              .toArray();

          return res.status(200).json({
            success: true,
            partners,
          });
        } catch (error) {
          console.error(
            "GET DELIVERY PARTNERS ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to fetch delivery partners",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // DELIVERY PARTNERS - ADD
    // =======================================================

    app.post(
      "/api/admin/delivery-partners",
      async (req, res) => {
        try {
          const {
            name,
            mobile,
            city,
          } = req.body;

          if (
            !name ||
            !mobile ||
            !city
          ) {
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

          return res.status(201).json({
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

          return res.status(500).json({
            success: false,
            message:
              "Failed to add delivery partner",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // DELIVERY PARTNERS - STATUS
    // =======================================================

    app.put(
      "/api/admin/delivery-partners/:id/status",
      async (req, res) => {
        try {
          const { id } = req.params;
          const { status } = req.body;

          if (
            !["Active", "Inactive"].includes(
              status
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid status. Use Active or Inactive",
            });
          }

          if (!isValidObjectId(id)) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid delivery partner ID",
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

          return res.json({
            success: true,
            message:
              "Delivery partner status updated",
          });
        } catch (error) {
          console.error(
            "DELIVERY STATUS ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to update delivery status",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // DELIVERY PARTNERS - DELETE
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

          return res.json({
            success: true,
            message:
              "Delivery partner deleted",
          });
        } catch (error) {
          console.error(
            "DELETE DELIVERY ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to delete delivery partner",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // ASSIGN ORDER TO DELIVERY PARTNER
    // =======================================================

    app.put(
      "/api/admin/orders/:orderId/assign-delivery",
      async (req, res) => {
        try {
          const { orderId } = req.params;
          const { partnerId } = req.body;

          if (!partnerId) {
            return res.status(400).json({
              success: false,
              message:
                "Delivery partner is required",
            });
          }

          if (!isValidObjectId(partnerId)) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid delivery partner ID",
            });
          }

          if (!isValidObjectId(orderId)) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid order ID",
            });
          }

          const partner =
            await deliveryPartnersCollection.findOne(
              {
                _id: new ObjectId(partnerId),
              }
            );

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
                  deliveryPartnerId:
                    partner._id,

                  deliveryPartnerName:
                    partner.name,

                  deliveryPartnerMobile:
                    partner.mobile,

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

          return res.json({
            success: true,
            message:
              "Order assigned successfully",
          });
        } catch (error) {
          console.error(
            "ASSIGN DELIVERY ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to assign order",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // 404
    // =======================================================

    app.use((req, res) => {
      return res.status(404).json({
        success: false,
        message:
          `Route not found: ${req.method} ${req.originalUrl}`,
      });
    });

    // =======================================================
    // START LISTENING
    // =======================================================

    app.listen(PORT, () => {
      console.log(
        `GraminMart Backend running on http://localhost:${PORT}`
      );
      console.log(
        "✅ MAKE DELIVERY PARTNER ROUTE REGISTERED"
      );
    });
  } catch (error) {
    console.error(
      "MongoDB Connection Failed:",
      error
    );

    process.exit(1);
  }
}

// =========================================================
// START APPLICATION
// =========================================================

startServer();