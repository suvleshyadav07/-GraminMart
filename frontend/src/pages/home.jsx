import { useState } from "react";
import "../Home.css";

function Home() {
  const [user] = useState(() => {
    const savedUser = localStorage.getItem("graminmartUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem("graminmartUser");
    window.location.href = "/login";
  };

  return (
    <div className="home">

      {/* Navbar */}
      <nav className="navbar">

        <div className="logo">
          🌾 <span>Gramin</span>Mart
        </div>

        <div className="nav-links">
          <a href="/">Home</a>
          <a href="#products">Products</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="welcome-user">
                👋 {user.name}
              </span>

              <button
                className="login-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="login-btn"
                onClick={() => (window.location.href = "/login")}
              >
                Login
              </button>

              <button
                className="register-btn"
                onClick={() => (window.location.href = "/register")}
              >
                Register
              </button>
            </>
          )}
        </div>

      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">

          <span className="hero-tag">
            🌱 Fresh From Local Farms
          </span>

          <h1>
            Gaon Se <span>Seedha</span>
            <br />
            Aapke Ghar Tak 🏠
          </h1>

          <p>
            Fresh vegetables, groceries, dairy products aur daily
            needs — ab local sellers se online order karein.
          </p>

          <div className="hero-buttons">
            <button className="shop-btn">
              🛒 Shop Now
            </button>

            <button className="seller-btn">
              🏪 Become a Seller
            </button>
          </div>

        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80"
            alt="Fresh vegetables"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="categories" id="products">

        <div className="section-heading">
          <span>SHOP BY CATEGORY</span>
          <h2>What are you looking for?</h2>
        </div>

        <div className="category-grid">

          <div className="category-card">
            <div className="category-icon">🥕</div>
            <h3>Vegetables</h3>
            <p>Fresh & Organic</p>
          </div>

          <div className="category-card">
            <div className="category-icon">🌾</div>
            <h3>Grocery</h3>
            <p>Daily Essentials</p>
          </div>

          <div className="category-card">
            <div className="category-icon">🥛</div>
            <h3>Dairy</h3>
            <p>Fresh Dairy</p>
          </div>

          <div className="category-card">
            <div className="category-icon">🍎</div>
            <h3>Fruits</h3>
            <p>Fresh Fruits</p>
          </div>

        </div>

      </section>

      {/* Why GraminMart */}
      <section className="why-section" id="about">

        <div className="section-heading">
          <span>WHY GRAMINMART?</span>
          <h2>Local Shopping Made Easy</h2>
        </div>

        <div className="features">

          <div className="feature">
            <div>🌱</div>
            <h3>Fresh Products</h3>
            <p>
              Quality products directly from local sellers.
            </p>
          </div>

          <div className="feature">
            <div>🏪</div>
            <h3>Local Sellers</h3>
            <p>
              Support your village shops and local businesses.
            </p>
          </div>

          <div className="feature">
            <div>🚚</div>
            <h3>Quick Delivery</h3>
            <p>
              Get your daily essentials delivered to your doorstep.
            </p>
          </div>

          <div className="feature">
            <div>💰</div>
            <h3>Fair Prices</h3>
            <p>
              Shop quality products at reasonable prices.
            </p>
          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="cta">

        <div>
          <span>🌾 SUPPORT LOCAL</span>

          <h2>
            Apne Gaon Ke Sellers Ko Support Karein
          </h2>

          <p>
            GraminMart ke saath local business ko digital banayein.
          </p>
        </div>

        <button>
          Start Shopping →
        </button>

      </section>

      {/* Footer */}
      <footer id="contact">

        <div className="footer-logo">
          🌾 GraminMart
        </div>

        <p>
          Village Online Shopping — Fresh products, local sellers.
        </p>

        <div className="copyright">
          © 2026 GraminMart. All rights reserved.
        </div>

      </footer>

    </div>
  );
}

export default Home;