import React, { useState, useContext, useEffect } from "react";
import { loginUser } from "../services/auth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import siglogo from "../siglogo.png";

const Login: React.FC = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, isAuthenticated } = useContext(AuthContext);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await loginUser(form);
      // User and token are already stored in loginUser function
      // Get the user from response or fetch it
      if (response.data.user) {
        setUser(response.data.user);
      } else {
        // Fetch user info if not in response
        const { getCurrentUser } = await import("../services/auth");
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch {
          // If getCurrentUser fails, use basic info from form
          setUser({ username: form.username });
        }
      }
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  return (
    <div className="auth-container">
      <div className="auth-theme-toggle-wrapper">
        <ThemeToggle />
      </div>
      <div className="auth-wrapper">
        <div className="auth-logo-section">
          <img src={siglogo} alt="TERRANXT" className="auth-logo" />
          <h1 className="auth-brand-title">TERRANXT SCADA</h1>
          <p className="auth-brand-subtitle">Industrial Control & Monitoring System</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-card glass">
          <div className="auth-header">
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Sign in to your account to continue</p>
          </div>

          {success && (
            <div className="auth-success" role="alert">
              <svg className="success-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="auth-error" role="alert">
              <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-row">
            <label htmlFor="username" className="auth-label">
              Username
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM3 17a7 7 0 0114 0H3z" />
              </svg>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                className="input"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="input"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                aria-describedby={error ? "login-error" : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.906 1.255L3.707 2.293zM14.95 6.05a4 4 0 01-4.95 4.95l-1.415-1.415a2 2 0 001.415-1.415L14.95 6.05zM2.853 2.853l14 14a1 1 0 01-1.415 1.415l-1.415-1.415A10.014 10.014 0 01.458 10C1.732 5.943 5.522 3 10 3c1.956 0 3.73.723 5.083 1.917l-1.415 1.415A7.975 7.975 0 0010 5a7.975 7.975 0 00-3.668.917L4.853 4.268A9.958 9.958 0 0110 3c4.478 0 8.268 2.943 9.542 7a9.958 9.958 0 01-2.225 4.225l-1.415-1.415A7.975 7.975 0 0018 10a7.975 7.975 0 00-.917-3.668l-1.415 1.415A4 4 0 0114 10a4 4 0 01-1.415 2.932l-1.415-1.415A2 2 0 0012 10a2 2 0 00-1.415-1.415L9.169 7.169A4 4 0 0114 10v.001l-1.415-1.415L2.853 2.853z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" className="checkbox" />
              <span>Remember me</span>
            </label>
            <Link to="#" className="auth-link">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="btn-spinner"></span>
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footnote">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="auth-link auth-link-primary">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
