import { useState } from "react";
import "./Login.css";

function Login() {
  const [formData, setFormData] = useState({
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

    if (!formData.email || !formData.password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("Login API Response:", data);
        alert(data.message || "Login failed");
        return;
      }

      alert(`Welcome ${data.user.name}! 🎉`);

      localStorage.setItem(
        "graminmartUser",
        JSON.stringify(data.user)
      );

      // Redirect according to user role
      if (data.user.role === "admin") {
        window.location.href = "/admin";
      } else if (data.user.role === "shop_owner") {
        window.location.href = "/shop-owner";
      } else if (data.user.role === "delivery_boy") {
        window.location.href = "/delivery";
      } else {
        if (data.user.role === "admin") {
  window.location.href = "/admin";
} else {
  window.location.href = "/";
}
      }

    } catch (error) {
      console.error("Login Error:", error);

      alert(
        "Backend se connection nahi ho raha. Check karo ki server running hai."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">

        <div className="login-logo">
          🌾 GraminMart
        </div>

        <h1>Welcome Back!</h1>

        <p>Login to your GraminMart account</p>

        <form onSubmit={handleSubmit}>

          <label>Email</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
          />

          <p>
            <a href="/forgot-password">
              Forgot Password?
            </a>
          </p>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="register-text">
          Don't have an account?{" "}
          <a href="/register">Register</a>
        </p>

      </div>
    </div>
  );
}

export default Login;