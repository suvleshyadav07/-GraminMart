require("dotenv").config();
require("dns").setServers(["8.8.8.8"]);

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");

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
  serverSelectionTimeoutMS: 10000,
});

// =========================================================
// COLLECTIONS
// =========================================================

let usersCollection;
let productsCollection;
let ordersCollection;
let deliveryPartnersCollection;

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
// OTP STORAGE
// =========================================================

const otpStore = new Map();

// =========================================================
// START SERVER
// =========================================================

async function startServer() {
  try {
    // =======================================================
    // CONNECT MONGODB
    // =======================================================

    await client.connect();

    console.log("MongoDB Connected Successfully");

    // =======================================================
    // DATABASE
    // =======================================================

    const db = client.db("graminmart");

   usersCollection = db.collection("users");
productsCollection = db.collection("products");
ordersCollection = db.collection("orders");
deliveryPartnersCollection = db.collection("deliveryPartners");

console.log("Database: graminmart");
console.log(
  "Collections: users, products, orders, deliveryPartners"
);
    // =======================================================
    // HOME
    // =======================================================

    app.get("/", (req, res) => {
      res.json({
        success: true,
        message: "GraminMart Backend is Running",
        database: "MongoDB Connected",
      });
    });

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

        if (!name || !mobile || !email || !password) {
          return res.status(400).json({
            success: false,
            message: "Please fill all fields",
          });
        }

        const cleanName = name.trim();
        const cleanMobile = mobile.trim();
        const cleanEmail = email.toLowerCase().trim();

        const existingUser = await usersCollection.findOne({
          $or: [
            { email: cleanEmail },
            { mobile: cleanMobile },
          ],
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Email or mobile already registered",
          });
        }

        const hashedPassword = await bcrypt.hash(
          password,
          10
        );

        const userRole =
          role === "seller" || role === "shop_owner"
            ? role
            : "customer";

        const result = await usersCollection.insertOne({
          name: cleanName,
          mobile: cleanMobile,
          email: cleanEmail,
          password: hashedPassword,
          role: userRole,
          createdAt: new Date(),
        });

        res.status(201).json({
          success: true,
          message: "Registration successful",
          userId: result.insertedId,
        });
      } catch (error) {
        console.error("Registration Error:", error);

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
        const {
          email,
          password,
        } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: "Email and password are required",
          });
        }

        const cleanEmail = email.toLowerCase().trim();

        const user = await usersCollection.findOne({
          email: cleanEmail,
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
            id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role || "customer",
          },
        });
      } catch (error) {
        console.error("Login Error:", error);

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

        const cleanEmail = email.toLowerCase().trim();

        const result = await usersCollection.updateOne(
          { email: cleanEmail },
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
        console.error("Make Admin Error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to make user admin",
          error: error.message,
        });
      }
    });

    // =======================================================
    // ADMIN - GET ALL USERS
    // =======================================================

    app.get("/api/admin/users", async (req, res) => {
      try {
        const users = await usersCollection
          .find({})
          .project({
            password: 0,
          })
          .sort({
            createdAt: -1,
          })
          .toArray();

        res.json({
          success: true,
          users,
        });
      } catch (error) {
        console.error("Get Users Error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to fetch users",
          error: error.message,
        });
      }
    });

    // =======================================================
    // FORGOT PASSWORD - SEND OTP
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

          const cleanEmail = email.toLowerCase().trim();

          const user = await usersCollection.findOne({
            email: cleanEmail,
          });

          if (!user) {
            return res.status(404).json({
              success: false,
              message: "No account found with this email",
            });
          }

          const otp = Math.floor(
            100000 + Math.random() * 900000
          ).toString();

          otpStore.set(cleanEmail, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
            verified: false,
          });

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cleanEmail,
            subject: "GraminMart Password Reset OTP",
            text:
              `Your GraminMart password reset OTP is ${otp}. ` +
              `This OTP is valid for 10 minutes.`,
          });

          console.log("OTP sent to:", cleanEmail);

          res.json({
            success: true,
            message: "OTP sent successfully to your email",
          });
        } catch (error) {
          console.error("OTP Email Error:", error);

          res.status(500).json({
            success: false,
            message: "Failed to send OTP email",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // VERIFY OTP
    // =======================================================

    app.post(
      "/api/verify-otp",
      async (req, res) => {
        try {
          const {
            email,
            otp,
          } = req.body;

          if (!email || !otp) {
            return res.status(400).json({
              success: false,
              message: "Email and OTP are required",
            });
          }

          const cleanEmail = email.toLowerCase().trim();

          const savedOtp = otpStore.get(cleanEmail);

          if (!savedOtp) {
            return res.status(400).json({
              success: false,
              message:
                "OTP not found. Please request a new OTP.",
            });
          }

          if (Date.now() > savedOtp.expiresAt) {
            otpStore.delete(cleanEmail);

            return res.status(400).json({
              success: false,
              message:
                "OTP expired. Please request a new OTP.",
            });
          }

          if (otp.toString() !== savedOtp.otp) {
            return res.status(400).json({
              success: false,
              message: "Invalid OTP",
            });
          }

          savedOtp.verified = true;

          res.json({
            success: true,
            message: "OTP verified successfully",
          });
        } catch (error) {
          console.error("Verify OTP Error:", error);

          res.status(500).json({
            success: false,
            message: "OTP verification failed",
            error: error.message,
          });
        }
      }
    );

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

          if (newPassword.length < 6) {
            return res.status(400).json({
              success: false,
              message:
                "Password must be at least 6 characters",
            });
          }

          const cleanEmail = email.toLowerCase().trim();

          const savedOtp = otpStore.get(cleanEmail);

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
            await bcrypt.hash(newPassword, 10);

          const result =
            await usersCollection.updateOne(
              { email: cleanEmail },
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

          otpStore.delete(cleanEmail);

          res.json({
            success: true,
            message:
              "Password reset successfully",
          });
        } catch (error) {
          console.error(
            "Reset Password Error:",
            error
          );

          res.status(500).json({
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

    app.post(
      "/api/products",
      async (req, res) => {
        try {
          const {
            name,
            description,
            price,
            category,
            stock,
            image,
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
                "Product name, price and category are required",
            });
          }

          const cleanName = name.trim();
          const cleanCategory = category.trim();

          const productPrice = Number(price);
          const productStock = Number(stock || 0);

          if (
            Number.isNaN(productPrice) ||
            productPrice < 0
          ) {
            return res.status(400).json({
              success: false,
              message: "Please enter a valid price",
            });
          }

          if (
            Number.isNaN(productStock) ||
            productStock < 0
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Please enter a valid stock quantity",
            });
          }

          const product = {
            name: cleanName,
            description: description
              ? description.trim()
              : "",
            price: productPrice,
            category: cleanCategory,
            stock: productStock,
            image: image || "",
            sellerId: sellerId || "",
            sellerName: sellerName || "",
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result =
            await productsCollection.insertOne(product);

          res.status(201).json({
            success: true,
            message: "Product added successfully",
            product: {
              _id: result.insertedId,
              ...product,
            },
          });
        } catch (error) {
          console.error(
            "Add Product Error:",
            error
          );

          res.status(500).json({
            success: false,
            message: "Failed to add product",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // GET ALL PRODUCTS
    // =======================================================

    app.get(
      "/api/products",
      async (req, res) => {
        try {
          const products =
            await productsCollection
              .find({})
              .sort({
                createdAt: -1,
              })
              .toArray();

          console.log(
            "Products fetched:",
            products.length
          );

          res.json({
            success: true,
            products,
          });
        } catch (error) {
          console.error(
            "Get Products Error:",
            error
          );

          res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // SHOP OWNER - GET OWN PRODUCTS
    // =======================================================

    // IMPORTANT:
    // This route is before /api/products/:id
    // so "seller" is not treated as a product ID.

    app.get(
      "/api/products/seller/:sellerId",
      async (req, res) => {
        try {
          const { sellerId } = req.params;

          if (!sellerId) {
            return res.status(400).json({
              success: false,
              message: "Seller ID is required",
            });
          }

          const products =
            await productsCollection
              .find({
                sellerId: sellerId,
              })
              .sort({
                createdAt: -1,
              })
              .toArray();

          res.json({
            success: true,
            products,
          });
        } catch (error) {
          console.error(
            "Seller Products Error:",
            error
          );

          res.status(500).json({
            success: false,
            message:
              "Failed to fetch seller products",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // ADMIN - GET ALL PRODUCTS
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

          res.json({
            success: true,
            products,
          });
        } catch (error) {
          console.error(
            "Admin Products Error:",
            error
          );

          res.status(500).json({
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

          if (!ObjectId.isValid(id)) {
            return res.status(400).json({
              success: false,
              message: "Invalid product ID",
            });
          }

          const product =
            await productsCollection.findOne({
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
          console.error(
            "Get Product Error:",
            error
          );

          res.status(500).json({
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

          if (!ObjectId.isValid(id)) {
            return res.status(400).json({
              success: false,
              message: "Invalid product ID",
            });
          }

          const {
            name,
            description,
            price,
            category,
            stock,
            image,
            status,
          } = req.body;

          const updateData = {
            updatedAt: new Date(),
          };

          if (name !== undefined) {
            if (!name.trim()) {
              return res.status(400).json({
                success: false,
                message:
                  "Product name cannot be empty",
              });
            }

            updateData.name = name.trim();
          }

          if (description !== undefined) {
            updateData.description =
              description.trim();
          }

          if (price !== undefined) {
            const productPrice = Number(price);

            if (
              Number.isNaN(productPrice) ||
              productPrice < 0
            ) {
              return res.status(400).json({
                success: false,
                message:
                  "Invalid product price",
              });
            }

            updateData.price = productPrice;
          }

          if (category !== undefined) {
            if (!category.trim()) {
              return res.status(400).json({
                success: false,
                message:
                  "Category cannot be empty",
              });
            }

            updateData.category =
              category.trim();
          }

          if (stock !== undefined) {
            const productStock = Number(stock);

            if (
              Number.isNaN(productStock) ||
              productStock < 0
            ) {
              return res.status(400).json({
                success: false,
                message:
                  "Invalid stock quantity",
              });
            }

            updateData.stock = productStock;
          }

          if (image !== undefined) {
            updateData.image = image;
          }

          if (status !== undefined) {
            updateData.status = status;
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

          const updatedProduct =
            await productsCollection.findOne({
              _id: new ObjectId(id),
            });

          res.json({
            success: true,
            message:
              "Product updated successfully",
            product: updatedProduct,
          });
        } catch (error) {
          console.error(
            "Update Product Error:",
            error
          );

          res.status(500).json({
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

          if (!ObjectId.isValid(id)) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid product ID",
            });
          }

          const result =
            await productsCollection.deleteOne({
              _id: new ObjectId(id),
            });

          if (result.deletedCount === 0) {
            return res.status(404).json({
              success: false,
              message:
                "Product not found",
            });
          }

          res.json({
            success: true,
            message:
              "Product deleted successfully",
          });
        } catch (error) {
          console.error(
            "Delete Product Error:",
            error
          );

          res.status(500).json({
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

    app.post(
      "/api/orders",
      async (req, res) => {
        try {
         const order = {
  ...req.body,
  sellerId:
    req.body.sellerId ||
    req.body.items?.find((item) => item.sellerId)?.sellerId ||
    "",
  sellerName:
    req.body.sellerName ||
    req.body.items?.find((item) => item.sellerName)?.sellerName ||
    "",
  sellerEmail:
    req.body.sellerEmail ||
    req.body.items?.find((item) => item.sellerEmail)?.sellerEmail ||
    "",
};

          if (
            !order.customer ||
            !order.items ||
            !Array.isArray(order.items) ||
            order.items.length === 0
          ) {
            return res.status(400).json({
              success: false,
              message: "Invalid order data",
            });
          }

          order.createdAt = new Date();
          order.status = "Pending";

          const result =
            await ordersCollection.insertOne(order);

          res.status(201).json({
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
            "Order Error:",
            error
          );

          res.status(500).json({
            success: false,
            message:
              "Failed to place order",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
    // GET ALL ORDERS - ADMIN
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

          res.json({
            success: true,
            orders,
          });
        } catch (error) {
          console.error(
            "Get Orders Error:",
            error
          );

          res.status(500).json({
            success: false,
            message:
              "Failed to fetch orders",
            error: error.message,
          });
        }
      }
    );

    // =======================================================
// ADMIN - DELIVERY PARTNERS
// =======================================================

// GET ALL DELIVERY PARTNERS
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
        "Get Delivery Partners Error:",
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


// ADD DELIVERY PARTNER
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
        "Add Delivery Partner Error:",
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


// UPDATE DELIVERY PARTNER STATUS
app.put(
  "/api/admin/delivery-partners/:id/status",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!ObjectId.isValid(id)) {
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
          { _id: new ObjectId(id) },
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
        "Update Partner Status Error:",
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


// DELETE DELIVERY PARTNER
app.delete(
  "/api/admin/delivery-partners/:id",
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid delivery partner ID",
        });
      }

      const result =
        await deliveryPartnersCollection.deleteOne({
          _id: new ObjectId(id),
        });

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
        "Delete Delivery Partner Error:",
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
// ADMIN - UPDATE ORDER STATUS
// =======================================================

app.put(
  "/api/admin/orders/:orderId/status",
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!ObjectId.isValid(orderId)) {
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

      const result =
        await ordersCollection.updateOne(
          { _id: new ObjectId(orderId) },
          {
            $set: {
              status: status,
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
          "Order status updated successfully",
      });
    } catch (error) {
      console.error(
        "Update Order Status Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update order status",
        error: error.message,
      });
    }
  }
);


// =======================================================
// ADMIN - ASSIGN DELIVERY PARTNER
// =======================================================

app.put(
  "/api/admin/orders/:orderId/assign-delivery",
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { partnerId } = req.body;

      if (
        !ObjectId.isValid(orderId) ||
        !ObjectId.isValid(partnerId)
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
          { _id: new ObjectId(orderId) },
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
        "Assign Delivery Error:",
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
// MAKE USER DELIVERY PARTNER
app.post("/api/make-delivery-partner", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailValue = email.trim().toLowerCase();

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
    console.error("Make Delivery Partner Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
    // =======================================================
    // START EXPRESS SERVER
    // =======================================================

    app.listen(PORT, () => {
      console.log(
        `GraminMart Backend running on http://localhost:${PORT}`
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
// RUN SERVER
// =========================================================

startServer();