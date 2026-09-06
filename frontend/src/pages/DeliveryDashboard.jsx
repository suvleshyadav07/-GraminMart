import React, { useEffect, useState } from "react";

const API_URL = "https://graminmart-backend.onrender.com";

function DeliveryDashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem(
      "graminmartUser"
    );

    try {
      const parsedUser = savedUser
        ? JSON.parse(savedUser)
        : null;

      if (!parsedUser) {
        window.location.href = "/login";
        return;
      }

      setUser(parsedUser);
      fetchOrders(parsedUser);
    } catch (error) {
      console.error("User Parse Error:", error);
      window.location.href = "/login";
    }
  }, []);

  const fetchOrders = async (currentUser) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/orders`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch orders"
        );
      }

      const allOrders = Array.isArray(data.orders)
        ? data.orders
        : [];

      const currentUserId = String(
        currentUser?.id || ""
      ).trim();

      const currentUserName = String(
        currentUser?.name || ""
      )
        .trim()
        .toLowerCase();

      const currentUserMobile = String(
        currentUser?.mobile || ""
      ).trim();

      const myOrders = allOrders.filter((order) => {
        if (!order.deliveryPartnerId) {
          return false;
        }

        const partnerId = String(
          order.deliveryPartnerId || ""
        ).trim();

        const partnerName = String(
          order.deliveryPartnerName || ""
        )
          .trim()
          .toLowerCase();

        const partnerMobile = String(
          order.deliveryPartnerMobile || ""
        ).trim();

        return (
          (currentUserId &&
            partnerId === currentUserId) ||
          (currentUserName &&
            partnerName === currentUserName) ||
          (currentUserMobile &&
            partnerMobile === currentUserMobile)
        );
      });

      setOrders(myOrders);
    } catch (error) {
      console.error(
        "Delivery Orders Error:",
        error
      );

      setError(
        error.message ||
          "Failed to load delivery orders"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    orderId,
    newStatus
  ) => {
    try {
      setUpdatingId(String(orderId));
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update order status"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          String(order._id) ===
          String(orderId)
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );
    } catch (error) {
      console.error(
        "Status Update Error:",
        error
      );

      alert(
        error.message ||
          "Failed to update order status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem(
      "graminmartUser"
    );

    window.location.href = "/login";
  };

  const getCustomerName = (order) => {
    return (
      order.customer?.name ||
      order.customerName ||
      order.customer?.email ||
      order.customerEmail ||
      "Customer"
    );
  };

  const getCustomerMobile = (order) => {
    return (
      order.customer?.mobile ||
      order.customerMobile ||
      order.mobile ||
      "Not available"
    );
  };

  const getCustomerAddress = (order) => {
    return (
      order.customer?.address ||
      order.address ||
      order.deliveryAddress ||
      "Address not available"
    );
  };

  const getOrderTotal = (order) => {
    return (
      order.totalAmount ??
      order.total ??
      order.amount ??
      0
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Assigned":
        return "status assigned";

      case "Out for Delivery":
        return "status out";

      case "Delivered":
        return "status delivered";

      default:
        return "status";
    }
  };

  return (
    <div className="delivery-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f4f7f5;
        }

        .delivery-page {
          min-height: 100vh;
          background: #f4f7f5;
        }

        .delivery-header {
          background: #2e7d32;
          color: white;
          padding: 18px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .delivery-title {
          margin: 0;
          font-size: 25px;
        }

        .delivery-welcome {
          margin: 6px 0 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .logout-btn {
          border: none;
          background: white;
          color: #2e7d32;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .delivery-container {
          width: 100%;
          max-width: 1150px;
          margin: 0 auto;
          padding: 25px;
        }

        .summary-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow:
            0 4px 15px rgba(0, 0, 0, 0.08);
        }

        .summary-card h2 {
          margin: 0 0 8px;
          color: #222;
        }

        .summary-card p {
          margin: 0;
          color: #666;
        }

        .summary-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 15px;
        }

        .refresh-btn {
          border: none;
          background: #2e7d32;
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .error-box {
          background: #ffebee;
          color: #c62828;
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .loading-box,
        .empty-box {
          background: white;
          padding: 40px 20px;
          border-radius: 15px;
          text-align: center;
          color: #666;
        }

        .orders-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }

        .order-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow:
            0 4px 15px rgba(0, 0, 0, 0.08);
        }

        .order-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .order-id {
          font-size: 18px;
          font-weight: bold;
          color: #222;
        }

        .status {
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          background: #eee;
          color: #444;
        }

        .status.assigned {
          background: #ede9fe;
          color: #6d28d9;
        }

        .status.out {
          background: #ffedd5;
          color: #c2410c;
        }

        .status.delivered {
          background: #dcfce7;
          color: #166534;
        }

        .customer-info {
          background: #f8faf8;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .customer-info p {
          margin: 6px 0;
          color: #444;
          line-height: 1.4;
        }

        .items-box {
          margin-bottom: 16px;
        }

        .items-box h4 {
          margin: 0 0 10px;
          color: #333;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .amount {
          font-size: 20px;
          font-weight: bold;
          color: #2e7d32;
          margin: 15px 0;
        }

        .status-actions {
          margin-top: 15px;
        }

        .status-actions label {
          display: block;
          font-weight: bold;
          color: #333;
          margin-bottom: 7px;
        }

        .status-actions select {
          width: 100%;
          padding: 11px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background: white;
          font-size: 14px;
        }

        .status-actions select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .delivery-container {
            padding: 15px;
          }

          .delivery-header {
            padding: 15px;
          }

          .delivery-title {
            font-size: 20px;
          }

          .orders-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header className="delivery-header">
        <div>
          <h1 className="delivery-title">
            🚚 Delivery Partner Dashboard
          </h1>

          <p className="delivery-welcome">
            Welcome,{" "}
            {user?.name ||
              "Delivery Partner"}
          </p>
        </div>

        <button
          className="logout-btn"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      <main className="delivery-container">
        <section className="summary-card">
          <h2>📦 My Assigned Orders</h2>

          <p>
            Total assigned orders:{" "}
            <strong>
              {orders.length}
            </strong>
          </p>

          <div className="summary-actions">
            <button
              className="refresh-btn"
              onClick={() => {
                if (user) {
                  fetchOrders(user);
                }
              }}
            >
              🔄 Refresh Orders
            </button>
          </div>
        </section>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-box">
            Loading delivery orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-box">
            <h3>
              📭 No Assigned Orders
            </h3>

            <p>
              Orders assigned by Admin
              will appear here.
            </p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => {
              const items =
                Array.isArray(order.items)
                  ? order.items
                  : [];

              return (
                <div
                  className="order-card"
                  key={String(order._id)}
                >
                  <div className="order-top">
                    <div className="order-id">
                      Order #
                      {String(
                        order._id
                      ).slice(-8)}
                    </div>

                    <div
                      className={getStatusClass(
                        order.status
                      )}
                    >
                      {order.status ||
                        "Assigned"}
                    </div>
                  </div>

                  <div className="customer-info">
                    <p>
                      <strong>
                        Customer:
                      </strong>{" "}
                      {getCustomerName(
                        order
                      )}
                    </p>

                    <p>
                      <strong>
                        Mobile:
                      </strong>{" "}
                      {getCustomerMobile(
                        order
                      )}
                    </p>

                    <p>
                      <strong>
                        Address:
                      </strong>{" "}
                      {getCustomerAddress(
                        order
                      )}
                    </p>
                  </div>

                  <div className="items-box">
                    <h4>
                      🛒 Order Items
                    </h4>

                    {items.length === 0 ? (
                      <p>
                        No item details
                      </p>
                    ) : (
                      items.map(
                        (item, index) => (
                          <div
                            className="item-row"
                            key={index}
                          >
                            <span>
                              {item.name ||
                                item.productName ||
                                "Product"}{" "}
                              ×{" "}
                              {item.quantity ||
                                1}
                            </span>

                            <span>
                              ₹
                              {item.price ||
                                0}
                            </span>
                          </div>
                        )
                      )
                    )}
                  </div>

                  <div className="amount">
                    Total: ₹
                    {getOrderTotal(
                      order
                    )}
                  </div>

                  <div className="status-actions">
                    <label>
                      Update Delivery Status
                    </label>

                    <select
                      value={
                        order.status ||
                        "Assigned"
                      }
                      disabled={
                        String(
                          updatingId
                        ) ===
                          String(
                            order._id
                          ) ||
                        order.status ===
                          "Delivered"
                      }
                      onChange={(event) =>
                        updateStatus(
                          order._id,
                          event.target.value
                        )
                      }
                    >
                      <option value="Assigned">
                        Assigned
                      </option>

                      <option value="Out for Delivery">
                        Out for Delivery
                      </option>

                      <option value="Delivered">
                        Delivered
                      </option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default DeliveryDashboard;