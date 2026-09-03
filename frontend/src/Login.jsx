import "./Login.css";

function Login() {
  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Welcome Back!</h1>

        <p>Login to your GraminMart account</p>

        <form>
          <label>Mobile Number</label>
          <input type="tel" placeholder="Enter mobile number" />

          <label>Password</label>
          <input type="password" placeholder="Enter password" />

          <button type="submit">Login</button>
        </form>

        <p className="register-text">
          Don't have an account?{" "}
          <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}

export default Login;