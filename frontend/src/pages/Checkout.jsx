import React, { useEffect, useState } from "react";
import "./checkout.css";

const CART_KEY = "graminmart_cart";
const USER_KEY = "graminmartUser";

function Checkout() {
  const [cart, setCart] = useState([]);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    address: "",
    city: "",
    pincode: "",
  });

  useEffect(() => {
    try {
      const savedCart = JSON.parse(
        localStorage.getItem(CART_KEY) || "[]"
      );

      setCart(Array.isArray(savedCart) ? savedCart : []);
    } catch (error) {
      console.error("Cart error:", error);
      setCart([]);
    }

    try {
      const savedUser = JSON.parse(
        localStorage.getItem(USER_KEY) || "null"
      );

      if (savedUser) {
        setForm((prev) => ({
          ...prev,
          name: savedUser.name || "",
          mobile: savedUser.mobile || "",
        }));
      }
    } catch (error) {
      console.error("User data error:", error);
    }
  }, []);

  // Total quantity
  const totalItems = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  // Total price
  const totalPrice = cart.reduce((sum, item) => {
    const price = Number(
      item.price ??
      item.unitPrice ??
      item.productPrice ??
      0
    );

    const quantity = Number(item.quantity || 0);

    return sum + price * quantity;
  }, 0);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const placeOrder = async (e) => {
    e.preventDefault();

    // Cart check
    if (cart.length === 0) {
      alert("Your cart is empty!");
      window.location.href = "/products";
      return;
    }

    // Delivery details check
    if (
      !form.name.trim() ||
      !form.mobile.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.pincode.trim()
    ) {
      alert("Please fill all delivery details.");
      return;
    }

    // Mobile validation
    if (!/^[0-9]{10}$/.test(form.mobile)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    // PIN validation
    if (!/^[0-9]{6}$/.test(form.pincode)) {
      alert("Please enter a valid 6-digit PIN code.");
      return;
    }

    let savedUser = null;

    try {
      savedUser = JSON.parse(
        localStorage.getItem(USER_KEY) || "null"
      );
    } catch (error) {
      console.error("User parse error:", error);
    }

    // Seller information
    const sellerId =
      cart.find((item) => item.sellerId)?.sellerId || null;

    const sellerName =
      cart.find((item) => item.sellerName)?.sellerName || "";

    const sellerEmail =
      cart.find((item) => item.sellerEmail)?.sellerEmail || "";

    // Final order object
    const order = {
      customer: {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
      },

      customerId: savedUser?.id || null,
      customerEmail: savedUser?.email || null,
      customerName: savedUser?.name || form.name.trim(),

      sellerId,
      sellerName,
      sellerEmail,

      items: cart,

      totalItems,
      totalPrice,
      totalAmount: totalPrice,

      deliveryCharge: 0,

      paymentMethod: "Cash on Delivery",
      status: "Pending",
    };

    console.log("ORDER SENT TO BACKEND:", order);

    try {
      const response = await fetch(
        "https://graminmart.onrender.com/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(order),
        }
      );

      const data = await response.json();

      console.log("ORDER API RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Order placement failed"
        );
      }

      // Save last order
      localStorage.setItem(
        "graminmart_last_order",
        JSON.stringify(data.order)
      );

      // Clear cart
      localStorage.removeItem(CART_KEY);

      // Update cart everywhere
      window.dispatchEvent(new Event("cartUpdated"));

      alert("Order placed successfully!");

      // Go to My Orders
      window.location.href = "/my-orders";
    } catch (error) {
      console.error("Order Error:", error);

      alert(
        "Order place nahi hua. Backend check karein.\n\n" +
        error.message
      );
    }
  };

  return (
    <div className="checkout-page">

      <div className="checkout-header">
        <h1>Checkout</h1>
        <p>Complete your order from GraminMart</p>
      </div>

      <div className="checkout-layout">

        {/* Delivery Form */}
        <form
          className="checkout-form"
          onSubmit={placeOrder}
        >
          <h2>Delivery Details</h2>

          <label>Full Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
          />

          <label>Mobile Number</label>

          <input
            type="tel"
            name="mobile"
            placeholder="Enter 10-digit mobile number"
            value={form.mobile}
            onChange={handleChange}
            maxLength={10}
          />

          <label>Address</label>

          <textarea
            name="address"
            placeholder="House no., village, street..."
            value={form.address}
            onChange={handleChange}
            rows={4}
          />

          <label>City / Village</label>

          <input
            type="text"
            name="city"
            placeholder="Enter city or village"
            value={form.city}
            onChange={handleChange}
          />

          <label>PIN Code</label>

          <input
            type="text"
            name="pincode"
            placeholder="Enter 6-digit PIN code"
            value={form.pincode}
            onChange={handleChange}
            maxLength={6}
          />

          <button
            type="submit"
            className="place-order-button"
          >
            Place Order
          </button>
        </form>

        {/* Order Summary */}
        <div className="checkout-summary">

          <h2>Your Order</h2>

          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cart.map((item, index) => {
              const price = Number(
                item.price ??
                item.unitPrice ??
                item.productPrice ??
                0
              );

              const quantity = Number(
                item.quantity || 0
              );

              return (
                <div
                  className="checkout-item"
                  key={
                    item._id ||
                    item.id ||
                    item.productId ||
                    index
                  }
                >

                  <img
                    src={
                      item.image ||
                      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80"
                    }
                    alt={item.name || "Product"}
                  />

                  <div>
                    <h3>
                      {item.name ||
                        item.productName ||
                        "Product"}
                    </h3>

                    <p>
                      ₹{price} × {quantity}
                    </p>
                  </div>

                  <strong>
                    ₹{price * quantity}
                  </strong>

                </div>
              );
            })
          )}

          <hr />

          <div className="summary-row">
            <span>Total Items</span>
            <strong>{totalItems}</strong>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>₹{totalPrice}</strong>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <strong>Free</strong>
          </div>

          <hr />

          <div className="grand-total">
            <span>Total</span>
            <strong>₹{totalPrice}</strong>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Checkout;
