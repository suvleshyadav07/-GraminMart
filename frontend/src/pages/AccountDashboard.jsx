import { useEffect, useState } from "react";

function AccountDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("graminmartUser");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("User data error:", error);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("graminmartUser");
    window.location.href = "/login";
  };

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const role = String(user.role || "customer")
    .toLowerCase()
    .trim();

  const goTo = (path) => {
    window.location.href = path;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#2e7d32",
          color: "white",
          padding: "18px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <h2 style={{ margin: 0 }}>🌾 GraminMart</h2>

        <button
          onClick={logout}
          style={{
            padding: "10px 18px",
            border: "none",
            borderRadius: "7px",
            background: "white",
            color: "#2e7d32",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </header>

      {/* Dashboard */}
      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
            marginBottom: "25px",
          }}
        >
          <h1 style={{ marginTop: 0 }}>
            Account Dashboard
          </h1>

          <p>
            Welcome, <strong>{user.name}</strong> 👋
          </p>

          <p>
            Email: <strong>{user.email}</strong>
          </p>

          <p>
            Role:{" "}
            <strong>
              {role === "seller" || role === "shop_owner"
                ? "Seller"
                : role === "delivery" ||
                  role === "delivery_partner"
                ? "Delivery Partner"
                : "Customer"}
            </strong>
          </p>
        </div>

        {/* CUSTOMER */}
        {role === "customer" && (
          <div>
            <h2>Customer Dashboard</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
              <DashboardCard
                icon="🛒"
                title="Shop Products"
                text="Browse GraminMart products"
                onClick={() => goTo("/products")}
              />

              <DashboardCard
                icon="📦"
                title="My Orders"
                text="View your orders and status"
                onClick={() => goTo("/my-orders")}
              />

              <DashboardCard
                icon="🛍️"
                title="My Cart"
                text="View items in your cart"
                onClick={() => goTo("/cart")}
              />

              <DashboardCard
                icon="🏠"
                title="Home"
                text="Go back to GraminMart home"
                onClick={() => goTo("/")}
              />
            </div>
          </div>
        )}

        {/* SELLER */}
        {(role === "seller" || role === "shop_owner") && (
          <div>
            <h2>Seller Dashboard</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
              <DashboardCard
                icon="🏪"
                title="Seller Dashboard"
                text="Manage products and orders"
                onClick={() => goTo("/seller")}
              />

              <DashboardCard
                icon="➕"
                title="Add Products"
                text="Add products to GraminMart"
                onClick={() => goTo("/seller")}
              />

              <DashboardCard
                icon="📦"
                title="Seller Orders"
                text="Manage customer orders"
                onClick={() => goTo("/seller")}
              />

              <DashboardCard
                icon="🏠"
                title="Home"
                text="Go back to GraminMart home"
                onClick={() => goTo("/")}
              />
            </div>
          </div>
        )}

        {/* DELIVERY PARTNER */}
        {(role === "delivery" ||
          role === "delivery_partner") && (
          <div>
            <h2>Delivery Partner Dashboard</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
              <DashboardCard
                icon="🚚"
                title="Delivery Dashboard"
                text="Manage your deliveries"
                onClick={() => goTo("/delivery")}
              />

              <DashboardCard
                icon="📦"
                title="Assigned Orders"
                text="View assigned customer orders"
                onClick={() => goTo("/delivery")}
              />

              <DashboardCard
                icon="📋"
                title="Delivery Status"
                text="Update delivery status"
                onClick={() => goTo("/delivery")}
              />

              <DashboardCard
                icon="🏠"
                title="Home"
                text="Go back to GraminMart home"
                onClick={() => goTo("/")}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  text,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        background: "white",
        border: "none",
        borderRadius: "15px",
        padding: "25px",
        cursor: "pointer",
        boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: "35px", marginBottom: "10px" }}>
        {icon}
      </div>

      <h3 style={{ margin: "5px 0" }}>{title}</h3>

      <p style={{ color: "#666", marginBottom: 0 }}>
        {text}
      </p>
    </button>
  );
}

export default AccountDashboard;