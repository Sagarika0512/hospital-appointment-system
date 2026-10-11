import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import { notify } from "../components/feedback/toast";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/Button";
import { PulseIcon, MailIcon } from "../components/ui/Icons";

function Login() {
  const { user, loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Load remembered email if previously stored
  const [email, setEmail] = useState(() => {
    return localStorage.getItem("cp_remembered_email") || "";
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    return Boolean(localStorage.getItem("cp_remembered_email"));
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const loginData = {
        email: email.trim(),
        password: password,
      };

      const response = await login(loginData);

      // Handle Remember Me preference
      if (rememberMe) {
        localStorage.setItem("cp_remembered_email", email.trim());
      } else {
        localStorage.removeItem("cp_remembered_email");
      }

      // Preserve existing AuthContext state contract
      loginUser(
        {
          name: response.name,
          email: response.email,
          role: response.role,
          patientId: response.patientId,
        },
        response.token
      );

      notify.success(`Welcome back, ${response.name}!`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Authentication error:", error);
      notify.apiError(
        error,
        "Invalid email or password. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-auth-wrapper">
      <div className="cp-auth-card">
        {/* Header & Branding */}
        <div className="cp-auth-header">
          <div className="cp-auth-brand-wrapper">
            <div className="cp-brand">
              <div className="cp-brand-icon-wrapper" aria-hidden="true">
                <PulseIcon size={22} />
              </div>
              <div className="cp-brand-text">
                <span className="cp-brand-name">CarePulse</span>
                <span className="cp-brand-badge">HMS</span>
              </div>
            </div>
          </div>

          <h2 className="cp-auth-title">Welcome back</h2>
          <p className="cp-auth-subtitle">
            Please sign in to access your healthcare portal.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} noValidate>
          <FormField
            id="login-email"
            label="Email address"
            required
            error={errors.email}
          >
            <Input
              id="login-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              iconPrefix={<MailIcon size={18} />}
              error={errors.email}
              disabled={loading}
              autoComplete="email"
            />
          </FormField>

          <FormField
            id="login-password"
            label="Password"
            required
            error={errors.password}
          >
            <PasswordInput
              id="login-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              error={errors.password}
              disabled={loading}
              autoComplete="current-password"
            />
          </FormField>

          {/* Remember Me Option */}
          <div className="cp-auth-options">
            <label className="cp-checkbox-label" htmlFor="login-remember">
              <input
                id="login-remember"
                type="checkbox"
                className="cp-checkbox-input"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>
          </div>

          {/* Submit Action */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loading}
            loadingText="Signing in..."
          >
            Sign In
          </Button>
        </form>

        {/* Footer Navigation */}
        <div className="cp-auth-footer">
          <span>Don't have an account?</span>
          <Link to="/register">Create an account</Link>
        </div>
      </div>

      <div className="cp-auth-notice">
        CarePulse Hospital Management System • Secure Healthcare Platform
      </div>
    </div>
  );
}

export default Login;