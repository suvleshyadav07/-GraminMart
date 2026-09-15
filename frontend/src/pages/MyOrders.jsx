import React, { useEffect, useState } from "react";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(
    localStorage.getItem("graminmartUser") || "null"
  );

  useEffect(() => {
    const loadOrders = async () => {
      try {
        if (!user?.email) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `https://graminmart.onrender.com/api/orders/user/${encodeURIComponent(
            user.email
          )}`
        );

        const data = await response.json();

        if (data.success) {
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Orders Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user?.email]);

  const getSteps = (status) => {
    const steps = [
      "Pending",
      "Confirmed",
      "Assigned",
      "Out for Delivery",
      "Delivered",
    ];

    const currentIndex = steps.indexOf(status);

    return steps.map((step, index) => ({
      name: step,
      active:
        currentIndex >= 0 &&
        index <= currentIndex,
    }));
  };

  if (!user) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Please login first</h2>

        <button
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "30px 20px",
      }}
    >
      <h1>📦 My Orders</h1>

      {loading && <p>Loading orders...</p>}

      {!loading && orders.length === 0 && (
        <div>
          <p>You have no orders yet.</p>

          <button
            onClick={() => {
              window.location.href = "/products";
            }}
          >
            Shop Now
          </button>
        </div>
      )}

      {!loading &&
        orders.map((order) => (
          <div
            key={order._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
              marginTop: "20px",
            }}
          >
            <h3>
              Order ID: {String(order._id)}
            </h3>

            <p>
              Total: ₹{order.totalPrice}
            </p>

            <p>
              Payment: {order.paymentMethod}
            </p>

            <p>
              Status: <strong>{order.status}</strong>
            </p>

            <h4>🚚 Order Tracking</h4>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {getSteps(
                order.status || "Pending"
              ).map((step) => (
                <div
                  key={step.name}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "20px",
                    background: step.active
                      ? "#2e7d32"
                      : "#e0e0e0",
                    color: step.active
                      ? "#fff"
                      : "#555",
                  }}
                >
                  {step.name}
                </div>
              ))}
            </div>

            {order.deliveryPartnerName && (
              <div style={{ marginTop: "15px" }}>
                <h4>🛵 Delivery Partner</h4>

                <p>
                  Name:{" "}
                  {order.deliveryPartnerName}
                </p>

                <p>
                  Mobile:{" "}
                  {order.deliveryPartnerMobile}
                </p>
              </div>
            )}

            <h4>Items</h4>

            {order.items?.map((item, index) => (
              <div key={index}>
                {item.name} × {item.quantity}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

export default MyOrders;


