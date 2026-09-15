import React, { useEffect, useState } from "react";
import "./product.css";

const API_URL = "https://graminmart.onrender.com";

function Product() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Products API Response:", data);

        setProducts(
          Array.isArray(data)
            ? data
            : Array.isArray(data.products)
            ? data.products
            : []
        );

        setLoading(false);
      })
      .catch((error) => {
        console.error("Products error:", error);
        setLoading(false);
      });
  }, []);

  const categories = [
    "All",
    "Vegetables",
    "Grocery",
    "Dairy",
    "Fruits",
  ];

  const filteredProducts = products.filter((product) => {
    const name = product.name || product.productName || "";

    const matchSearch = name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchCategory =
      category === "All" ||
      (product.category || "").toLowerCase() ===
        category.toLowerCase();

    return matchSearch && matchCategory;
  });

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>🛒 GraminMart Products</h1>
        <p>Fresh products from local sellers</p>
      </div>

      <div className="products-controls">
        <input
          type="text"
          placeholder="🔎 Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <h2 className="loading">Loading products...</h2>
      ) : filteredProducts.length === 0 ? (
        <div className="no-products">
          <h2>😔 No products found</h2>
          <p>Try another search or category.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <div
              className="product-card"
              key={product._id || product.id}
            >
              <img
                src={
                  product.image ||
                  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
                }
                alt={product.name || product.productName}
              />

              <div className="product-info">
                <span className="category">
                  {product.category || "General"}
                </span>

                <h2>
                  {product.name || product.productName}
                </h2>

                <p>
                  {product.description ||
                    "Fresh quality product"}
                </p>

                <div className="product-bottom">
                  <strong>₹{product.price || 0}</strong>

                  <button
  onClick={() => {
    const cart = JSON.parse(
      localStorage.getItem("graminmart_cart") || "[]"
    );

    const productId = product._id || product.id;

    const existingProduct = cart.find(
      (item) => (item._id || item.id) === productId
    );

    let updatedCart;

    if (existingProduct) {
      updatedCart = cart.map((item) =>
        (item._id || item.id) === productId
          ? {
              ...item,
              quantity: (item.quantity || 1) + 1,
            }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          ...product,
          quantity: 1,
        },
      ];
    }

    localStorage.setItem(
      "graminmart_cart",
      JSON.stringify(updatedCart)
    );

    alert(
      `${product.name || product.productName} added to cart!`
    );
  }}
>
  🛒 Add to Cart
</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Product;

