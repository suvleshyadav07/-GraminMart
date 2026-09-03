import React, { useEffect, useState } from "react";
import "./cart.css";

const CART_KEY = "graminmart_cart";

function Cart() {
  const [cart, setCart] = useState([]);

  // Load cart
  const loadCart = () => {
    try {
      const savedCart = JSON.parse(
        localStorage.getItem(CART_KEY) || "[]"
      );

      setCart(Array.isArray(savedCart) ? savedCart : []);
    } catch (error) {
      console.error("Cart loading error:", error);
      setCart([]);
    }
  };

  useEffect(() => {
    loadCart();

    window.addEventListener("cartUpdated", loadCart);

    return () => {
      window.removeEventListener("cartUpdated", loadCart);
    };
  }, []);

  // Save cart
  const saveCart = (updatedCart) => {
    setCart(updatedCart);

    localStorage.setItem(
      CART_KEY,
      JSON.stringify(updatedCart)
    );

    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Increase / decrease quantity
  const updateQuantity = (id, change) => {
    const updatedCart = cart
      .map((item) => {
        const itemId = item._id || item.id;

        if (itemId === id) {
          return {
            ...item,
            quantity: Math.max(0, item.quantity + change),
          };
        }

        return item;
      })
      .filter((item) => item.quantity > 0);

    saveCart(updatedCart);
  };

  // Remove item
  const removeItem = (id) => {
    const updatedCart = cart.filter(
      (item) => (item._id || item.id) !== id
    );

    saveCart(updatedCart);
  };

  // Clear cart
  const clearCart = () => {
    if (window.confirm("Are you sure you want to clear the cart?")) {
      saveCart([]);
    }
  };

  // Total items
  const totalItems = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  // Total price
  const totalPrice = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  return (
    <div className="cart-page">

      {/* Header */}
      <div className="cart-header">
        <h1>🛒 My Cart</h1>

        <p>
          {totalItems}{" "}
          {totalItems === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      {/* Empty Cart */}
      {cart.length === 0 ? (
        <div className="empty-cart">

          <div className="empty-cart-icon">
            🛒
          </div>

          <h2>Your cart is empty</h2>

          <p>
            Add some fresh products from GraminMart.
          </p>

          <a
            href="/products"
            className="shop-button"
          >
            🛍️ Continue Shopping
          </a>

        </div>
      ) : (

        <div className="cart-layout">

          {/* Cart Items */}
          <div className="cart-items">

            {cart.map((item) => {

              const id = item._id || item.id;

              const itemTotal =
                Number(item.price || 0) *
                Number(item.quantity || 0);

              return (
                <div
                  className="cart-item"
                  key={id}
                >

                  {/* Product Image */}
                  <img
                    src={
                      item.image ||
                      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={
                      item.name ||
                      item.productName ||
                      "Product"
                    }
                  />

                  {/* Product Info */}
                  <div className="cart-item-info">

                    <span>
                      {item.category || "General"}
                    </span>

                    <h2>
                      {item.name ||
                        item.productName ||
                        "Product"}
                    </h2>

                    <p>
                      ₹{item.price || 0} each
                    </p>

                  </div>

                  {/* Quantity */}
                  <div className="quantity-box">

                    <button
                      onClick={() =>
                        updateQuantity(id, -1)
                      }
                    >
                      −
                    </button>

                    <strong>
                      {item.quantity}
                    </strong>

                    <button
                      onClick={() =>
                        updateQuantity(id, 1)
                      }
                    >
                      +
                    </button>

                  </div>

                  {/* Item Total */}
                  <strong className="item-total">
                    ₹{itemTotal}
                  </strong>

                  {/* Remove */}
                  <button
                    className="remove-button"
                    onClick={() =>
                      removeItem(id)
                    }
                    title="Remove item"
                  >
                    🗑️
                  </button>

                </div>
              );
            })}

          </div>

          {/* Order Summary */}
          <div className="cart-summary">

            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Items</span>
              <span>{totalItems}</span>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>
                ₹{totalPrice}
              </strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <span>Free</span>
            </div>

            <hr />

            <div className="summary-total">
              <span>Total</span>

              <strong>
                ₹{totalPrice}
              </strong>
            </div>

          <button
  className="checkout-button"
  onClick={() => {
    window.location.href = "/checkout";
  }}
>
  💳 Proceed to Checkout
</button>

            <button
              onClick={() => {
  window.location.href = "/checkout";
}}
            >
              🧹 Clear Cart
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default Cart;