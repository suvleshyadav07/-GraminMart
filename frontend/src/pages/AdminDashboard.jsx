import React, { useEffect, useState } from "react";

const API_URL = "https://graminmart.onrender.com";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    image: "",
  });

  const [newPartner, setNewPartner] = useState({
    name: "",
    mobile: "",
    city: "",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  // ==========================================
  // LOAD ALL DASHBOARD DATA
  // ==========================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await Promise.all([
        fetchUsers(),
        fetchProducts(),
        fetchOrders(),
        fetchDeliveryPartners(),
      ]);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // USERS
  // ==========================================

  const fetchUsers = async () => {
    const response = await fetch(
      `${API_URL}/api/admin/users`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Failed to fetch users"
      );
    }

    setUsers(data.users || []);
  };

  // ==========================================
  // PRODUCTS
  // ==========================================

  const fetchProducts = async () => {
    const response = await fetch(
      `${API_URL}/api/admin/products`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Failed to fetch products"
      );
    }

    setProducts(data.products || []);
  };

  // ==========================================
  // ORDERS
  // ==========================================

  const fetchOrders = async () => {
    const response = await fetch(
      `${API_URL}/api/admin/orders`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Failed to fetch orders"
      );
    }

    setOrders(data.orders || []);
  };

  // ==========================================
  // DELIVERY PARTNERS
  // ==========================================

  const fetchDeliveryPartners = async () => {
    const response = await fetch(
      `${API_URL}/api/admin/delivery-partners`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to fetch delivery partners"
      );
    }

    setDeliveryPartners(data.partners || []);
  };

  // ==========================================
  // ADD PRODUCT
  // ==========================================

  const handleAddProduct = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newProduct.name,
            description: newProduct.description,
            price: Number(newProduct.price),
            category: newProduct.category,
            stock: Number(newProduct.stock || 0),
            image: newProduct.image,
            sellerName: "Admin",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to add product"
        );
      }

      setMessage("Product added successfully");

      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "",
        image: "",
      });

      await fetchProducts();
    } catch (err) {
      console.error("Add Product Error:", err);
      setError(
        err.message || "Failed to add product"
      );
    }
  };

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  const deleteProduct = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete product"
        );
      }

      setMessage("Product deleted successfully");

      await fetchProducts();
    } catch (err) {
      console.error("Delete Product Error:", err);
      setError(
        err.message || "Failed to delete product"
      );
    }
  };

  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================

  const updateOrderStatus = async (
    orderId,
    newStatus
  ) => {
    try {
      setError("");
      setMessage("");

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
          data.message || "Failed to update order status"
        );
      }

      setMessage(
        "Order status updated successfully"
      );

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          String(order._id) === String(orderId)
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );
    } catch (err) {
      console.error(
        "Order Status Error:",
        err
      );

      setError(
        err.message ||
          "Failed to update order status"
      );
    }
  };

  // ==========================================
  // ADD DELIVERY PARTNER
  // ==========================================

  const handleAddPartner = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/delivery-partners`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newPartner.name,
            mobile: newPartner.mobile,
            city: newPartner.city,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to add delivery partner"
        );
      }

      setMessage(
        "Delivery partner added successfully"
      );

      setNewPartner({
        name: "",
        mobile: "",
        city: "",
      });

      await fetchDeliveryPartners();
    } catch (err) {
      console.error(
        "Add Delivery Partner Error:",
        err
      );

      setError(
        err.message ||
          "Failed to add delivery partner"
      );
    }
  };

  // ==========================================
  // DELIVERY PARTNER STATUS
  // ==========================================

  const updatePartnerStatus = async (
    partnerId,
    status
  ) => {
    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/delivery-partners/${partnerId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update partner status"
        );
      }

      setMessage(
        "Delivery partner status updated"
      );

      await fetchDeliveryPartners();
    } catch (err) {
      console.error(
        "Partner Status Error:",
        err
      );

      setError(
        err.message ||
          "Failed to update partner status"
      );
    }
  };

  // ==========================================
  // DELETE DELIVERY PARTNER
  // ==========================================

  const deletePartner = async (partnerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this delivery partner?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/delivery-partners/${partnerId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete delivery partner"
        );
      }

      setMessage(
        "Delivery partner deleted successfully"
      );

      await fetchDeliveryPartners();
      await fetchOrders();
    } catch (err) {
      console.error(
        "Delete Partner Error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete delivery partner"
      );
    }
  };

  // ==========================================
  // ASSIGN DELIVERY PARTNER
  // ==========================================

  const assignPartner = async (
    orderId,
    partnerId
  ) => {
    if (!partnerId) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/orders/${orderId}/assign-delivery`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            partnerId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to assign delivery partner"
        );
      }

      setMessage(
        "Order assigned successfully"
      );

      await fetchOrders();
    } catch (err) {
      console.error(
        "Assign Partner Error:",
        err
      );

      setError(
        err.message ||
          "Failed to assign delivery partner"
      );
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem(
      "graminmartUser"
    );

    window.location.href = "/login";
  };

  // ==========================================
  // HELPERS
  // ==========================================

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

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="admin-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f4f7f5;
        }

        .admin-page {
          min-height: 100vh;
          background: #f4f7f5;
        }

        .admin-header {
          background: #1b5e20;
          color: white;
          padding: 18px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .admin-header h1 {
          margin: 0;
          font-size: 25px;
        }

        .admin-header p {
          margin: 5px 0 0;
          opacity: 0.9;
        }

        .logout-btn {
          border: none;
          background: white;
          color: #1b5e20;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .admin-container {
          max-width: 1250px;
          margin: auto;
          padding: 25px;
        }

        .top-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
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

        .message {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 15px;
          font-weight: bold;
        }

        .error {
          background: #ffebee;
          color: #c62828;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 15px;
          font-weight: bold;
        }

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: white;
          border-radius: 14px;
          padding: 20px;
          box-shadow:
            0 4px 14px rgba(0, 0, 0, 0.07);
        }

        .stat-card h3 {
          margin: 0 0 8px;
          font-size: 14px;
          color: #666;
        }

        .stat-card strong {
          font-size: 30px;
          color: #1b5e20;
        }

        .section {
          background: white;
          border-radius: 15px;
          padding: 22px;
          margin-bottom: 25px;
          box-shadow:
            0 4px 14px rgba(0, 0, 0, 0.07);
        }

        .section h2 {
          margin-top: 0;
          color: #222;
        }

        .form-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .form-grid input,
        .form-grid select,
        .form-grid textarea {
          width: 100%;
          padding: 11px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 14px;
        }

        .form-grid textarea {
          min-height: 44px;
          resize: vertical;
        }

        .primary-btn {
          border: none;
          background: #2e7d32;
          color: white;
          padding: 11px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        th,
        td {
          padding: 12px 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
          vertical-align: middle;
        }

        th {
          background: #f7faf7;
          color: #333;
        }

        td {
          color: #444;
        }

        .small-btn {
          border: none;
          padding: 8px 11px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: bold;
          margin-right: 5px;
        }

        .danger-btn {
          background: #ffebee;
          color: #c62828;
        }

        .status-select {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 7px;
          background: white;
        }

        .order-items {
          margin: 0;
          padding-left: 18px;
        }

        .order-items li {
          margin-bottom: 4px;
        }

        .assigned {
          display: inline-block;
          margin-top: 6px;
          font-size: 12px;
          color: #2e7d32;
          font-weight: bold;
        }

        .muted {
          color: #777;
          font-size: 13px;
        }

        .loading {
          background: white;
          padding: 40px;
          border-radius: 15px;
          text-align: center;
          color: #666;
        }

        @media (max-width: 600px) {
          .admin-container {
            padding: 15px;
          }

          .admin-header {
            padding: 15px;
          }

          .admin-header h1 {
            font-size: 21px;
          }

          .section {
            padding: 16px;
          }
        }
      `}</style>

      <header className="admin-header">
        <div>
          <h1>👑 GraminMart Admin Dashboard</h1>
          <p>
            Manage users, products, orders and delivery partners
          </p>
        </div>

        <button
          className="logout-btn"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      <main className="admin-container">
        <div className="top-actions">
          <button
            className="refresh-btn"
            onClick={loadDashboard}
          >
            🔄 Refresh Dashboard
          </button>
        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">
            Loading Admin Dashboard...
          </div>
        ) : (
          <>
            {/* ======================================
                STATS
            ====================================== */}

            <div className="stats-grid">
              <div className="stat-card">
                <h3>👥 Users</h3>
                <strong>{users.length}</strong>
              </div>

              <div className="stat-card">
                <h3>🛍️ Products</h3>
                <strong>{products.length}</strong>
              </div>

              <div className="stat-card">
                <h3>📦 Orders</h3>
                <strong>{orders.length}</strong>
              </div>

              <div className="stat-card">
                <h3>🚚 Delivery Partners</h3>
                <strong>
                  {deliveryPartners.length}
                </strong>
              </div>
            </div>

            {/* ======================================
                ADD PRODUCT
            ====================================== */}

            <section className="section">
              <h2>➕ Add Product</h2>

              <form
                onSubmit={handleAddProduct}
              >
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Product name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        name: e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Category"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        category:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        price: e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        stock: e.target.value,
                      })
                    }
                  />

                  <input
                    type="text"
                    placeholder="Image URL"
                    value={newProduct.image}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        image: e.target.value,
                      })
                    }
                  />

                  <textarea
                    placeholder="Description"
                    value={
                      newProduct.description
                    }
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description:
                          e.target.value,
                      })
                    }
                  />

                  <button
                    type="submit"
                    className="primary-btn"
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </section>

            {/* ======================================
                PRODUCTS
            ====================================== */}

            <section className="section">
              <h2>🛍️ Products</h2>

              {products.length === 0 ? (
                <p className="muted">
                  No products found.
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Seller</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {products.map(
                        (product) => (
                          <tr
                            key={String(
                              product._id
                            )}
                          >
                            <td>
                              {product.name}
                            </td>

                            <td>
                              {product.category}
                            </td>

                            <td>
                              ₹{product.price}
                            </td>

                            <td>
                              {product.stock ??
                                0}
                            </td>

                            <td>
                              {product.sellerName ||
                                "Admin"}
                            </td>

                            <td>
                              <button
                                className="small-btn danger-btn"
                                onClick={() =>
                                  deleteProduct(
                                    product._id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ======================================
                USERS
            ====================================== */}

            <section className="section">
              <h2>👥 Users</h2>

              {users.length === 0 ? (
                <p className="muted">
                  No users found.
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Role</th>
                        <th>Created</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map(
                        (userItem) => (
                          <tr
                            key={String(
                              userItem._id
                            )}
                          >
                            <td>
                              {userItem.name}
                            </td>

                            <td>
                              {userItem.email}
                            </td>

                            <td>
                              {userItem.mobile ||
                                "—"}
                            </td>

                            <td>
                              {userItem.role ||
                                "customer"}
                            </td>

                            <td>
                              {userItem.createdAt
                                ? new Date(
                                    userItem.createdAt
                                  ).toLocaleDateString()
                                : "—"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ======================================
                DELIVERY PARTNERS
            ====================================== */}

            <section className="section">
              <h2>🚚 Delivery Partners</h2>

              <form
                onSubmit={handleAddPartner}
              >
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Partner name"
                    value={newPartner.name}
                    onChange={(e) =>
                      setNewPartner({
                        ...newPartner,
                        name: e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Mobile number"
                    value={
                      newPartner.mobile
                    }
                    onChange={(e) =>
                      setNewPartner({
                        ...newPartner,
                        mobile:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="City"
                    value={newPartner.city}
                    onChange={(e) =>
                      setNewPartner({
                        ...newPartner,
                        city: e.target.value,
                      })
                    }
                    required
                  />

                  <button
                    type="submit"
                    className="primary-btn"
                  >
                    Add Delivery Partner
                  </button>
                </div>
              </form>

              <br />

              {deliveryPartners.length === 0 ? (
                <p className="muted">
                  No delivery partners found.
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>City</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {deliveryPartners.map(
                        (partner) => (
                          <tr
                            key={String(
                              partner._id
                            )}
                          >
                            <td>
                              {partner.name}
                            </td>

                            <td>
                              {partner.mobile}
                            </td>

                            <td>
                              {partner.city}
                            </td>

                            <td>
                              <select
                                className="status-select"
                                value={
                                  String(
                                    partner.status ||
                                      "active"
                                  ).toLowerCase()
                                }
                                onChange={(e) =>
                                  updatePartnerStatus(
                                    partner._id,
                                    e.target.value
                                  )
                                }
                              >
                                <option value="active">
                                  Active
                                </option>

                                <option value="inactive">
                                  Inactive
                                </option>
                              </select>
                            </td>

                            <td>
                              <button
                                className="small-btn danger-btn"
                                onClick={() =>
                                  deletePartner(
                                    partner._id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ======================================
                ORDERS
            ====================================== */}

            <section className="section">
              <h2>📦 Orders</h2>

              {orders.length === 0 ? (
                <p className="muted">
                  No orders found.
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Contact</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Delivery Partner</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map(
                        (order) => {
                          const items =
                            Array.isArray(
                              order.items
                            )
                              ? order.items
                              : [];

                          return (
                            <tr
                              key={String(
                                order._id
                              )}
                            >
                              <td>
                                #
                                {String(
                                  order._id
                                ).slice(-8)}
                              </td>

                              <td>
                                <strong>
                                  {getCustomerName(
                                    order
                                  )}
                                </strong>
                                <br />
                                <span className="muted">
                                  {getCustomerAddress(
                                    order
                                  )}
                                </span>
                              </td>

                              <td>
                                {getCustomerMobile(
                                  order
                                )}
                              </td>

                              <td>
                                {items.length >
                                0 ? (
                                  <ul className="order-items">
                                    {items.map(
                                      (
                                        item,
                                        index
                                      ) => (
                                        <li
                                          key={
                                            index
                                          }
                                        >
                                          {item.name ||
                                            item.productName ||
                                            "Product"}{" "}
                                          ×{" "}
                                          {item.quantity ||
                                            1}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                ) : (
                                  "No items"
                                )}
                              </td>

                              <td>
                                ₹
                                {getOrderTotal(
                                  order
                                )}
                              </td>

                              <td>
                                <select
                                  className="status-select"
                                  value={
                                    order.status ||
                                    "Pending"
                                  }
                                  onChange={(e) =>
                                    updateOrderStatus(
                                      order._id,
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="Pending">
                                    Pending
                                  </option>

                                  <option value="Confirmed">
                                    Confirmed
                                  </option>

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
                              </td>

                              <td>
                                <select
                                  className="status-select"
                                  value={
                                    order.deliveryPartnerId
                                      ? String(
                                          order.deliveryPartnerId
                                        )
                                      : ""
                                  }
                                  onChange={(e) =>
                                    assignPartner(
                                      order._id,
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">
                                    Select Partner
                                  </option>

                                  {deliveryPartners
                                    .filter(
                                      (partner) =>
                                        String(
                                          partner.status ||
                                            "active"
                                        ).toLowerCase() ===
                                        "active"
                                    )
                                    .map(
                                      (partner) => (
                                        <option
                                          key={String(
                                            partner._id
                                          )}
                                          value={String(
                                            partner._id
                                          )}
                                        >
                                          {partner.name} -{" "}
                                          {partner.city}
                                        </option>
                                      )
                                    )}
                                </select>

                                {order.deliveryPartnerName && (
                                  <span className="assigned">
                                    Assigned:{" "}
                                    {
                                      order.deliveryPartnerName
                                    }
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
