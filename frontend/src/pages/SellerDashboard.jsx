import React, { useEffect, useState } from "react";

const API = "http://localhost:5000";

export default function SellerDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // =====================================================
  // LOAD USER
  // =====================================================

  useEffect(() => {
    const savedUser = localStorage.getItem("graminmartUser");

    if (savedUser) {
      const loggedUser = JSON.parse(savedUser);

      setUser(loggedUser);

      if (loggedUser.id) {
        loadProducts(loggedUser.id);
        loadOrders(loggedUser.id);
      }
    }
  }, []);

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  const loadProducts = async (sellerId) => {
    try {
      const response = await fetch(
        `${API}/api/products/seller/${sellerId}`
      );

      const data = await response.json();

      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Load Products Error:", error);
    }
  };

  // =====================================================
  // ADD PRODUCT
  // =====================================================

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!productName.trim()) {
      alert("Please enter product name");
      return;
    }

    if (!category.trim()) {
      alert("Please enter category");
      return;
    }

    if (!price || Number(price) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    if (stock === "" || Number(stock) < 0) {
      alert("Please enter a valid stock");
      return;
    }

    if (!user?.id) {
      alert("Seller information not found. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: productName.trim(),
          productName: productName.trim(),
          category: category.trim(),
          price: Number(price),
          stock: Number(stock),
          sellerId: user.id,
          sellerName: user.name,
          sellerEmail: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to add product");
        return;
      }

      alert("Product added successfully! ✅");

      setProductName("");
      setCategory("");
      setPrice("");
      setStock("");

      loadProducts(user.id);
    } catch (error) {
      console.error("Add Product Error:", error);
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API}/api/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to delete product");
        return;
      }

      alert("Product deleted successfully.");

      loadProducts(user.id);
    } catch (error) {
      console.error("Delete Product Error:", error);
      alert("Server error. Please try again.");
    }
  };

  // =====================================================
  // LOAD SELLER ORDERS
  // =====================================================

  const loadOrders = async (sellerId) => {
    try {
      setOrdersLoading(true);

      const response = await fetch(
        `${API}/api/orders/seller/${sellerId}`
      );

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Load Orders Error:", error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // =====================================================
  // UPDATE ORDER STATUS
  // =====================================================

  const updateOrderStatus = async (orderId, status) => {
    if (!user?.id) {
      alert("Seller information not found.");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/orders/${orderId}/seller-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            sellerId: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to update order status");
        return;
      }

      alert(`Order status changed to ${status} ✅`);

      loadOrders(user.id);
    } catch (error) {
      console.error("Update Order Status Error:", error);
      alert("Server error. Please try again.");
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("graminmartUser");
    window.location.href = "/login";
  };

  // =====================================================
  // LOGIN CHECK
  // =====================================================

  if (!user) {
    return (
      <div style={styles.center}>
        <h2>Please Login</h2>
      </div>
    );
  }

  if (
    user.role !== "seller" &&
    user.role !== "shop_owner"
  ) {
    return (
      <div style={styles.center}>
        <h1>🚫 Access Denied</h1>

        <p>Only sellers can access this page.</p>

        <button
          onClick={() => (window.location.href = "/")}
          style={styles.homeButton}
        >
          Go Home
        </button>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>
            🌾 GraminMart Seller Dashboard
          </h1>

          <p style={styles.welcome}>
            Welcome, {user.name}
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </button>
      </header>


      {/* SELLER INFORMATION */}

      <section style={styles.card}>

        <div style={styles.infoRow}>

          <div>
            <h2>Seller Information</h2>

            <p>
              <strong>Name:</strong> {user.name}
            </p>

            <p>
              <strong>Email:</strong> {user.email}
            </p>

            <p>
              <strong>Role:</strong> {user.role}
            </p>
          </div>

          <div style={styles.productCount}>
            <h1>{products.length}</h1>
            <p>My Products</p>
          </div>

        </div>

      </section>


      {/* ADD PRODUCT */}

      <section style={styles.card}>

        <h2 style={styles.sectionTitle}>
          ➕ Add New Product
        </h2>

        <form onSubmit={handleAddProduct}>

          <div style={styles.formGrid}>

            <input
              type="text"
              placeholder="Product Name"
              value={productName}
              onChange={(e) =>
                setProductName(e.target.value)
              }
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              style={styles.input}
            />

            <input
              type="number"
              placeholder="Price"
              min="1"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
              style={styles.input}
            />

            <input
              type="number"
              placeholder="Stock"
              min="0"
              value={stock}
              onChange={(e) =>
                setStock(e.target.value)
              }
              style={styles.input}
            />

          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.addButton}
          >
            {loading
              ? "Adding Product..."
              : "➕ Add Product"}
          </button>

        </form>

      </section>


      {/* MY PRODUCTS */}

      <section style={styles.card}>

        <h2 style={styles.sectionTitle}>
          🛒 My Products
        </h2>

        {products.length === 0 ? (

          <div style={styles.empty}>
            <h3>No Products Added Yet</h3>

            <p>
              Add your first product using the form above.
            </p>
          </div>

        ) : (

          <div style={styles.productGrid}>

            {products.map((product) => (

              <div
                key={product._id}
                style={styles.productCard}
              >

                <h3>
                  {product.name ||
                    product.productName}
                </h3>

                <p>
                  <strong>Category:</strong>{" "}
                  {product.category}
                </p>

                <p>
                  <strong>Price:</strong> ₹
                  {product.price}
                </p>

                <p>
                  <strong>Stock:</strong>{" "}
                  {product.stock}
                </p>

                <button
                  onClick={() =>
                    handleDeleteProduct(product._id)
                  }
                  style={styles.deleteButton}
                >
                  🗑 Delete
                </button>

              </div>

            ))}

          </div>

        )}

      </section>


      {/* =================================================
          SELLER ORDERS DASHBOARD
          ================================================= */}

      <section style={styles.card}>

        <div style={styles.ordersHeader}>

          <h2 style={styles.sectionTitle}>
            📦 Seller Orders
          </h2>

          <button
            onClick={() => loadOrders(user.id)}
            style={styles.refreshButton}
          >
            🔄 Refresh Orders
          </button>

        </div>


        {ordersLoading ? (

          <div style={styles.empty}>
            <h3>Loading Orders...</h3>
          </div>

        ) : orders.length === 0 ? (

          <div style={styles.empty}>
            <h3>No Orders Found</h3>

            <p>
              New customer orders will appear here.
            </p>
          </div>

        ) : (

          <div style={styles.ordersContainer}>

            {orders.map((order, index) => (

              <div
                key={order._id || index}
                style={styles.orderCard}
              >

                {/* ORDER HEADER */}

                <div style={styles.orderTop}>

                  <div>

                    <h3>
                      Order #
                      {String(
                        order._id || index + 1
                      ).slice(-6)}
                    </h3>

                    <p style={styles.orderDate}>
                      {order.createdAt
                        ? new Date(
                            order.createdAt
                          ).toLocaleString()
                        : "Date not available"}
                    </p>

                  </div>

                  <div
                    style={getStatusStyle(
                      order.status
                    )}
                  >
                    {order.status || "Pending"}
                  </div>

                </div>


                {/* CUSTOMER */}

                <div style={styles.customerBox}>

                  <h4>👤 Customer Details</h4>

                  <p>
                    <strong>Name:</strong>{" "}
                    {order.userName ||
                      order.customerName ||
                      "N/A"}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {order.userEmail ||
                      order.customerEmail ||
                      "N/A"}
                  </p>

                  <p>
                    <strong>Mobile:</strong>{" "}
                    {order.userMobile ||
                      order.customerMobile ||
                      "N/A"}
                  </p>

                  <p>
                    <strong>Address:</strong>{" "}
                    {order.address || "N/A"}
                  </p>

                </div>


                {/* ORDER ITEMS */}

                <div style={styles.itemsBox}>

                  <h4>🛍 Order Items</h4>

                  {Array.isArray(order.items) &&
                  order.items.length > 0 ? (

                    order.items.map(
                      (item, itemIndex) => (

                        <div
                          key={itemIndex}
                          style={styles.itemRow}
                        >

                          <span>
                            {item.name ||
                              item.productName ||
                              "Product"}
                          </span>

                          <span>
                            Qty:{" "}
                            {item.quantity ||
                              item.qty ||
                              1}
                          </span>

                          <span>
                            ₹
                            {Number(
                              item.price || 0
                            ) *
                              Number(
                                item.quantity ||
                                  item.qty ||
                                  1
                              )}
                          </span>

                        </div>

                      )
                    )

                  ) : (

                    <p>No item details available.</p>

                  )}

                </div>


                {/* TOTAL */}

                <div style={styles.totalBox}>

                  <strong>Total Amount:</strong>

                  <strong>
                    ₹
                    {order.totalAmount ||
                      order.total ||
                      0}
                  </strong>

                </div>


                {/* STATUS ACTIONS */}

                <div style={styles.statusActions}>

                  <h4>Update Order Status</h4>

                  <div style={styles.statusButtons}>

                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order._id,
                          "Confirmed"
                        )
                      }
                      style={styles.confirmButton}
                    >
                      ✓ Confirm
                    </button>

                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order._id,
                          "Assigned"
                        )
                      }
                      style={styles.assignButton}
                    >
                      👤 Assigned
                    </button>

                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order._id,
                          "Out for Delivery"
                        )
                      }
                      style={styles.deliveryButton}
                    >
                      🚚 Out for Delivery
                    </button>

                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order._id,
                          "Delivered"
                        )
                      }
                      style={styles.deliveredButton}
                    >
                      ✓ Delivered
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}


// =======================================================
// STATUS STYLE
// =======================================================

function getStatusStyle(status) {

  const base = {
    padding: "8px 14px",
    borderRadius: "20px",
    fontWeight: "bold",
    display: "inline-block",
  };

  if (status === "Confirmed") {
    return {
      ...base,
      background: "#e8f5e9",
      color: "#2e7d32",
    };
  }

  if (status === "Assigned") {
    return {
      ...base,
      background: "#fff3e0",
      color: "#ef6c00",
    };
  }

  if (status === "Out for Delivery") {
    return {
      ...base,
      background: "#e3f2fd",
      color: "#1565c0",
    };
  }

  if (status === "Delivered") {
    return {
      ...base,
      background: "#e8f5e9",
      color: "#1b5e20",
    };
  }

  return {
    ...base,
    background: "#eeeeee",
    color: "#555",
  };
}


// =======================================================
// STYLES
// =======================================================

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f4f7f4",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    background: "#2e7d32",
    color: "white",
    padding: "28px 5%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    margin: 0,
    fontSize: "32px",
  },

  welcome: {
    fontSize: "18px",
    marginTop: "10px",
  },

  logoutButton: {
    background: "white",
    color: "#2e7d32",
    border: "none",
    padding: "13px 25px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  card: {
    background: "white",
    margin: "35px auto",
    padding: "32px",
    width: "88%",
    borderRadius: "15px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  productCount: {
    background: "#e8f5e9",
    color: "#2e7d32",
    width: "180px",
    padding: "20px",
    textAlign: "center",
    borderRadius: "15px",
  },

  sectionTitle: {
    fontSize: "27px",
    marginBottom: "25px",
    color: "#183b1a",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },

  input: {
    padding: "17px",
    border: "1px solid #ccc",
    borderRadius: "9px",
    fontSize: "16px",
    outline: "none",
  },

  addButton: {
    marginTop: "25px",
    background: "#2e7d32",
    color: "white",
    border: "none",
    padding: "15px 30px",
    borderRadius: "8px",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  productGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "20px",
  },

  productCard: {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "20px",
    background: "#fafafa",
  },

  deleteButton: {
    background: "#d32f2f",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "35px",
    background: "#f7f7f7",
    borderRadius: "10px",
  },

  center: {
    textAlign: "center",
    padding: "100px 20px",
  },

  homeButton: {
    background: "#2e7d32",
    color: "white",
    border: "none",
    padding: "12px 25px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  ordersHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  refreshButton: {
    background: "#2e7d32",
    color: "white",
    border: "none",
    padding: "11px 18px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  ordersContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },

  orderCard: {
    border: "1px solid #ddd",
    borderRadius: "14px",
    padding: "22px",
    background: "#fafafa",
  },

  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #ddd",
    paddingBottom: "15px",
    marginBottom: "18px",
  },

  orderDate: {
    color: "#777",
    fontSize: "14px",
  },

  customerBox: {
    background: "#fff",
    padding: "18px",
    borderRadius: "10px",
    marginBottom: "18px",
  },

  itemsBox: {
    background: "#fff",
    padding: "18px",
    borderRadius: "10px",
  },

  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #eee",
  },

  totalBox: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "19px",
    padding: "18px 0",
  },

  statusActions: {
    borderTop: "1px solid #ddd",
    paddingTop: "18px",
  },

  statusButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  confirmButton: {
    background: "#2e7d32",
    color: "white",
    border: "none",
    padding: "11px 18px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  assignButton: {
    background: "#ef6c00",
    color: "white",
    border: "none",
    padding: "11px 18px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  deliveryButton: {
    background: "#1565c0",
    color: "white",
    border: "none",
    padding: "11px 18px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  deliveredButton: {
    background: "#1b5e20",
    color: "white",
    border: "none",
    padding: "11px 18px",
    borderRadius: "7px",
    cursor: "pointer",
  },
};