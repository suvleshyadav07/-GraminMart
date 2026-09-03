const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);

let usersCollection;

async function startServer() {
  try {
    await client.connect();

    console.log("MongoDB Connected Successfully");

    const db = client.db("graminmart");
    usersCollection = db.collection("users");

    // HOME
    app.get("/", (req, res) => {
      res.json({
        message: "GraminMart Backend is Running",
        database: "MongoDB Connected"
      });
    });

    // REGISTER
    app.post("/api/register", async (req, res) => {
      try {
        const { name, mobile, email, password } = req.body;

        if (!name || !mobile || !email || !password) {
          return res.status(400).json({
            message: "Please fill all fields"
          });
        }

        const cleanEmail = email.toLowerCase().trim();
        const cleanMobile = mobile.trim();

        const existingUser = await usersCollection.findOne({
          $or: [
            { email: cleanEmail },
            { mobile: cleanMobile }
          ]
        });

        if (existingUser) {
          return res.status(409).json({
            message: "Email or mobile already registered"
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await usersCollection.insertOne({
          name: name.trim(),
          mobile: cleanMobile,
          email: cleanEmail,
          password: hashedPassword,
          role: "customer",
          createdAt: new Date()
        });

        res.status(201).json({
          message: "Registration successful",
          userId: result.insertedId
        });

      } catch (error) {
        console.error("Registration Error:", error);

        res.status(500).json({
          message: "Registration failed"
        });
      }
    });

    // LOGIN
    app.post("/api/login", async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            message: "Email and password are required"
          });
        }

        const cleanEmail = email.toLowerCase().trim();

        const user = await usersCollection.findOne({
          email: cleanEmail
        });

        if (!user) {
          return res.status(401).json({
            message: "Invalid email or password"
          });
        }

        const passwordMatch = await bcrypt.compare(
          password,
          user.password
        );

        if (!passwordMatch) {
          return res.status(401).json({
            message: "Invalid email or password"
          });
        }

        res.json({
          message: "Login successful",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });

      } catch (error) {
        console.error("Login Error:", error);

        res.status(500).json({
          message: "Login failed"
        });
      }
    });

    // FORGOT PASSWORD
    app.post("/api/forgot-password", async (req, res) => {
      try {
        console.log("FORGOT PASSWORD API CALLED");

        const { email } = req.body;

        if (!email) {
          return res.status(400).json({
            message: "Email is required"
          });
        }

        const cleanEmail = email.toLowerCase().trim();

        const user = await usersCollection.findOne({
          email: cleanEmail
        });

        if (!user) {
          return res.status(404).json({
            message: "No account found with this email"
          });
        }

        console.log("User found:", cleanEmail);

        res.json({
          message: "Email found. Reset process can continue."
        });

      } catch (error) {
        console.error("Forgot Password Error:", error);

        res.status(500).json({
          message: "Forgot password failed"
        });
      }
    });

    // START SERVER
    app.listen(PORT, () => {
      console.log(
        `GraminMart Backend running on http://localhost:${PORT}`
      );
    });

  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
  }
}

startServer();