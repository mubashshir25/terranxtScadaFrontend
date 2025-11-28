import React, { useState, useContext, useEffect } from "react";
import { registerUser } from "../services/auth";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import companyLogo from "../companylogo.png";

interface SignupForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

const Signup: React.FC = () => {
  const [form, setForm] = useState<SignupForm>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [] });
  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useContext(AuthContext);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("At least 8 characters");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Lowercase letter");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Uppercase letter");
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Number");
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Special character");
    }

    return { score, feedback };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (passwordStrength.score < 3) {
      setError("Password is too weak. Please use a stronger password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerUser({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      // If backend auto-logs in after registration, handle it
      if (response.data.token || response.data.access_token) {
        // User is logged in, set user and navigate to home
        if (response.data.user) {
          setUser(response.data.user);
        } else {
          setUser({ username: form.username, email: form.email });
        }
        navigate("/");
      } else {
        // Normal flow: redirect to login
        navigate("/login", { state: { message: "Account created successfully! Please sign in." } });
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Signup failed. Please check your input or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthLabel = (score: number): string => {
    if (score === 0) return "Very Weak";
    if (score <= 2) return "Weak";
    if (score === 3) return "Fair";
    if (score === 4) return "Good";
    return "Strong";
  };

  const getPasswordStrengthColor = (score: number): string => {
    if (score === 0) return "var(--color-error)";
    if (score <= 2) return "#ef4444";
    if (score === 3) return "#f59e0b";
    if (score === 4) return "#3b82f6";
    return "#22c55e";
  };

  return (
    <div className="auth-container">
      <div className="auth-theme-toggle-wrapper">
        <ThemeToggle />
      </div>
      <div className="auth-wrapper">
        <div className="auth-logo-section">
          <img src={companyLogo} alt="TERRANXT" className="auth-logo" />
          <h1 className="auth-brand-title">TERRANXT SCADA</h1>
          <p className="auth-brand-subtitle">Industrial Control & Monitoring System</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-card glass">
          <div className="auth-header">
            <h2 className="auth-title">Create account</h2>
            <p className="auth-subtitle">Join the platform to get started</p>
          </div>

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
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                className="input"
                required
                autoComplete="username"
                minLength={3}
              />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="email" className="auth-label">
              Email
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={form.email}
                onChange={handleChange}
                className="input"
                required
                autoComplete="email"
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
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                className="input"
                required
                autoComplete="new-password"
                minLength={8}
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
            {form.password && (
              <div className="password-strength">
                <div className="password-strength-bar">
                  <div
                    className="password-strength-fill"
                    style={{
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                    }}
                  />
                </div>
                <div className="password-strength-label">
                  <span style={{ color: getPasswordStrengthColor(passwordStrength.score) }}>
                    {getPasswordStrengthLabel(passwordStrength.score)}
                  </span>
                  {passwordStrength.feedback.length > 0 && (
                    <span className="password-requirements">
                      Missing: {passwordStrength.feedback.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-row">
            <label htmlFor="confirmPassword" className="auth-label">
              Confirm Password
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`input ${form.confirmPassword && form.password !== form.confirmPassword ? "input-error" : ""}`}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
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
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <div className="form-error-text">Passwords do not match</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading || passwordStrength.score < 3}
          >
            {isLoading ? (
              <>
                <span className="btn-spinner"></span>
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footnote">
            Already have an account?{" "}
            <Link to="/login" className="auth-link auth-link-primary">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
