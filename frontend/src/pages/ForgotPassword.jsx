import { useState } from "react";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // SEND OTP
  const sendOTP = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://graminmart.onrender.com/api/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert(data.message);
      setStep(2);

    } catch (error) {
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP
  const verifyOTP = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      alert("Please enter 6 digit OTP");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://graminmart.onrender.com/api/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            otp: otp.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert(data.message);
      setStep(3);

    } catch (error) {
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD
  const resetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://graminmart.onrender.com/api/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Password reset successfully!");

      setEmail("");
      setOtp("");
      setNewPassword("");
      setStep(1);

    } catch (error) {
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">

      <div className="forgot-card">

        {/* Logo */}
        <div className="brand">
          <div className="brand-icon">🌱</div>
          <h1>Gramin<span>Mart</span></h1>
        </div>

        {/* Heading */}
        <h2>Forgot Password?</h2>

        <p className="subtitle">
          Reset your password securely using your email OTP.
        </p>

        {/* Progress */}
        <div className="steps">
          <div className={step >= 1 ? "step active" : "step"}>
            <span>1</span>
            <small>Email</small>
          </div>

          <div className={step >= 2 ? "line active" : "line"}></div>

          <div className={step >= 2 ? "step active" : "step"}>
            <span>2</span>
            <small>OTP</small>
          </div>

          <div className={step >= 3 ? "line active" : "line"}></div>

          <div className={step >= 3 ? "step active" : "step"}>
            <span>3</span>
            <small>Password</small>
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={sendOTP}>

            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={verifyOTP}>

            <div className="email-info">
              OTP has been sent to
              <strong>{email}</strong>
            </div>

            <label>Enter OTP</label>

            <input
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength="6"
              placeholder="••••••"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ""))
              }
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              className="back-btn"
              onClick={() => setStep(1)}
            >
              Change Email
            </button>

          </form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <form onSubmit={resetPassword}>

            <div className="success-box">
              ✓ OTP Verified Successfully
            </div>

            <label>New Password</label>

            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>

          </form>
        )}

        <div className="login-link">
          Remember your password?
          <a href="/login"> Login</a>
        </div>

        <div className="secure-text">
          🔒 Your account information is secure
        </div>

      </div>
    </div>
  );
}

export default ForgotPassword;
