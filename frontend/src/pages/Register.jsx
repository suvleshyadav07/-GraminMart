import { useState } from "react";
import "./Register.css";

function Register() {
  const [role, setRole] = useState("customer");

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.mobile ||
      !formData.email ||
      !formData.password
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            role: role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert(
        `${role === "customer"
          ? "Customer"
          : role === "seller"
          ? "Seller"
          : "Delivery Partner"
        } registration successful!`
      );

      window.location.href = "/login";
    } catch (error) {
      console.error("Registration Error:", error);

      alert(
        "Backend se connection nahi ho raha. Check karo ki server running hai."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-box">

        <div className="register-logo">
          🌾 GraminMart
        </div>

        <h1>Create Account</h1>

        <p>Join GraminMart today</p>

        {/* ROLE SELECTION */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setRole("customer")}
            style={{
              flex: 1,
              minWidth: "100px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #2e7d32",
              background:
                role === "customer" ? "#2e7d32" : "white",
              color:
                role === "customer" ? "white" : "#2e7d32",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            👤 Customer
          </button>

          <button
            type="button"
            onClick={() => setRole("seller")}
            style={{
              flex: 1,
              minWidth: "100px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #2e7d32",
              background:
                role === "seller" ? "#2e7d32" : "white",
              color:
                role === "seller" ? "white" : "#2e7d32",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🏪 Seller
          </button>

          <button
            type="button"
            onClick={() => setRole("delivery_partner")}
            style={{
              flex: 1,
              minWidth: "100px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #2e7d32",
              background:
                role === "delivery_partner"
                  ? "#2e7d32"
                  : "white",
              color:
                role === "delivery_partner"
                  ? "white"
                  : "#2e7d32",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🚚 Delivery
          </button>
        </div>

        <h3 style={{ textAlign: "center", marginBottom: "15px" }}>
          {role === "customer"
            ? "Customer Registration"
            : role === "seller"
            ? "Seller Registration"
            : "Delivery Partner Registration"}
        </h3>

        <form onSubmit={handleSubmit}>

          <label>Full Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Mobile Number</label>

          <input
            type="tel"
            name="mobile"
            placeholder="Enter 10-digit mobile number"
            value={formData.mobile}
            onChange={handleChange}
            maxLength="10"
            required
          />

          <label>Email</label>

          <input
            type="email"
            name="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Create password"
            value={formData.password}
            onChange={handleChange}
            minLength="6"
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>

        </form>

        <p className="login-text">
          Already have an account?{" "}
          <a href="/login">Login</a>
        </p>

      </div>
    </div>
  );
}

export default Register;