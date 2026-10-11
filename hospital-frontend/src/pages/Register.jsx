import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import { notify } from "../components/feedback/toast";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/Button";
import { PulseIcon, MailIcon, UserIcon } from "../components/ui/Icons";

function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Map First Name + Last Name to backend expected "name" field
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      const userData = {
        name: fullName,
        email: email.trim(),
        password: password,
        role: "PATIENT",
      };

      await register(userData);

      notify.success("Registration successful! Please sign in with your credentials.");
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      notify.apiError(
        error,
        "Registration failed. Email may already be registered or invalid."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-auth-wrapper">
      <div className="cp-auth-card cp-auth-card-wide">
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

          <h2 className="cp-auth-title">Create an account</h2>
          <p className="cp-auth-subtitle">
            Register as a new patient to book consultations and manage appointments.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} noValidate>
          {/* First Name & Last Name (Responsive 2-column grid) */}
          <div className="cp-auth-grid-2">
            <FormField
              id="reg-firstname"
              label="First name"
              required
              error={errors.firstName}
            >
              <Input
                id="reg-firstname"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName) {
                    setErrors((prev) => ({ ...prev, firstName: undefined }));
                  }
                }}
                iconPrefix={<UserIcon size={18} />}
                error={errors.firstName}
                disabled={loading}
                autoComplete="given-name"
              />
            </FormField>

            <FormField
              id="reg-lastname"
              label="Last name"
              required
              error={errors.lastName}
            >
              <Input
                id="reg-lastname"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName) {
                    setErrors((prev) => ({ ...prev, lastName: undefined }));
                  }
                }}
                error={errors.lastName}
                disabled={loading}
                autoComplete="family-name"
              />
            </FormField>
          </div>

          {/* Email Address */}
          <FormField
            id="reg-email"
            label="Email address"
            required
            error={errors.email}
          >
            <Input
              id="reg-email"
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

          {/* Password */}
          <FormField
            id="reg-password"
            label="Password"
            required
            helperText="Must be at least 6 characters"
            error={errors.password}
          >
            <PasswordInput
              id="reg-password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              error={errors.password}
              disabled={loading}
              autoComplete="new-password"
            />
          </FormField>

          {/* Confirm Password */}
          <FormField
            id="reg-confirm-password"
            label="Confirm password"
            required
            error={errors.confirmPassword}
          >
            <PasswordInput
              id="reg-confirm-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              error={errors.confirmPassword}
              disabled={loading}
              autoComplete="new-password"
            />
          </FormField>

          {/* Submit Action */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loading}
            loadingText="Creating account..."
            style={{ marginTop: "0.5rem" }}
          >
            Create Account
          </Button>
        </form>

        {/* Footer Navigation */}
        <div className="cp-auth-footer">
          <span>Already have an account?</span>
          <Link to="/">Sign In</Link>
        </div>
      </div>

      <div className="cp-auth-notice">
        CarePulse Hospital Management System • Secure Healthcare Platform
      </div>
    </div>
  );
}

export default Register;