import AccountDashboard from "./pages/AccountDashboard.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Home from "./pages/home.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/Register.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Users from "./pages/Users.jsx";
import Product from "./pages/product.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import DeliveryDashboard from "./pages/DeliveryDashboard.jsx";
import SellerDashboard from "./pages/SellerDashboard.jsx";

function App() {
  const path = window.location.pathname;

  const savedUser = localStorage.getItem("graminmartUser");

  let user = null;

  try {
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch {
    user = null;
  }

  // =========================
  // LOGIN
  // =========================
  if (path === "/login") {
    return <Login />;
  }

  // =========================
  // REGISTER
  // =========================
  if (path === "/register") {
    return <Register />;
  }
// =========================
// ACCOUNT DASHBOARD
// =========================
if (path === "/account") {
  return <AccountDashboard />;
}
  // =========================
  // PRODUCTS
  // =========================
  if (path === "/products") {
    return <Product />;
  }

  // =========================
  // CART
  // =========================
  if (path === "/cart") {
    return <Cart />;
  }

  // =========================
  // CHECKOUT
  // =========================
  if (path === "/checkout") {
    return <Checkout />;
  }

  // =========================
  // MY ORDERS
  // =========================
  if (path === "/my-orders") {
    return <MyOrders />;
  }

  // =========================
  // FORGOT PASSWORD
  // =========================
  if (path === "/forgot-password") {
    return <ForgotPassword />;
  }

  // =========================
  // SELLER
  // =========================
  if (path === "/seller") {
    if (!user) {
      window.location.href = "/login";
      return null;
    }

    if (
      user.role !== "seller" &&
      user.role !== "shop_owner"
    ) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <h1>🚫 Access Denied</h1>

          <p>Only sellers can access this page.</p>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              background: "#2e7d32",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Go Home
          </button>
        </div>
      );
    }

    return <SellerDashboard />;
  }

  // =========================
  // DELIVERY PARTNER
  // =========================
  if (path === "/delivery") {
    if (!user) {
      window.location.href = "/login";
      return null;
    }

    if (
      user.role !== "delivery" &&
      user.role !== "delivery_partner"
    ) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <h1>🚫 Access Denied</h1>

          <p>
            Only delivery partners can access this page.
          </p>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              background: "#2e7d32",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Go Home
          </button>
        </div>
      );
    }

    return <DeliveryDashboard />;
  }

  // =========================
  // ADMIN SECURITY
  // =========================
  if (path === "/admin" || path === "/admin/users") {
    if (!user) {
      window.location.href = "/login";
      return null;
    }
    if (String(user.role || "").toLowerCase() !== "admin") {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <h1>🚫 Access Denied</h1>

          <p>
            Only administrators can access this page.
          </p>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              background: "#2e7d32",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Go Home
          </button>
        </div>
      );
    }

    // =========================
    // USERS PAGE
    // =========================
    if (path === "/admin/users") {
      return <Users />;
    }

    // =========================
    // ADMIN DASHBOARD
    // =========================
    return <AdminDashboard />;
  }

  // =========================
  // HOME
  // =========================
  return <Home />;
}

export default App;