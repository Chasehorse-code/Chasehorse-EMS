import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Phone, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { FormField } from '@/components/ui/FormField';
import { PasswordField } from '@/components/ui/PasswordField';

export interface CustomerRegisterViewProps {
  onSwitchView: (view: 'login' | 'worker') => void;
  onClose: () => void;
}

export function CustomerRegisterView({ onSwitchView, onClose }: CustomerRegisterViewProps) {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Field validation error states
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [shakingField, setShakingField] = useState<string | null>(null);

  const triggerShake = (fieldName: string) => {
    setShakingField(fieldName);
    window.setTimeout(() => setShakingField(null), 500);
  };

  const validateCompany = (val: string): boolean => {
    if (!val.trim()) {
      setCompanyError('Company or enterprise name is required.');
      return false;
    }
    setCompanyError(null);
    return true;
  };

  const validateContact = (val: string): boolean => {
    if (!val.trim()) {
      setContactError('Contact person name is required.');
      return false;
    }
    setContactError(null);
    return true;
  };

  const validateEmail = (val: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) {
      setEmailError('Work email is required.');
      return false;
    }
    if (!emailRegex.test(val.trim())) {
      setEmailError('Please enter a valid work email.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePhone = (val: string): boolean => {
    const cleanPhone = val.replace(/[\s\-]/g, '');
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!val.trim()) {
      setPhoneError('Phone number is required.');
      return false;
    }
    if (!phoneRegex.test(cleanPhone)) {
      setPhoneError('Enter a valid 10-digit Indian phone number.');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Password is required.');
      return false;
    }
    if (val.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const validateConfirmPassword = (val: string): boolean => {
    if (!val) {
      setConfirmError('Please confirm your password.');
      return false;
    }
    if (val !== password) {
      setConfirmError('Passwords do not match.');
      return false;
    }
    setConfirmError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const isCompanyOk = validateCompany(companyName);
    const isContactOk = validateContact(contactName);
    const isEmailOk = validateEmail(email);
    const isPhoneOk = validatePhone(phone);
    const isPassOk = validatePassword(password);
    const isConfirmOk = validateConfirmPassword(confirmPassword);

    if (!isCompanyOk) {
      triggerShake('company');
      return;
    }
    if (!isContactOk) {
      triggerShake('contact');
      return;
    }
    if (!isEmailOk) {
      triggerShake('email');
      return;
    }
    if (!isPhoneOk) {
      triggerShake('phone');
      return;
    }
    if (!isPassOk) {
      triggerShake('password');
      return;
    }
    if (!isConfirmOk) {
      triggerShake('confirm');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, {
        displayName: companyName.trim() ? `${companyName.trim()} (${contactName.trim()})` : contactName.trim(),
        phone: phone.trim(),
        accountType: 'CUSTOMER',
      });

      // Customer gets instant ACTIVE access (no pending approval required per blueprint)
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      if (msg.toLowerCase().includes('rate limit')) {
        setIsSuccess(true);
        return;
      }
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchDashboard = async () => {
    try {
      await signIn(email.trim(), password);
    } catch {
      // Ignored if already signed in or requires explicit OTP
    }
    onClose();
    navigate('/customer/dashboard', { replace: true });
  };

  // Success view: Customer accounts receive instant ACTIVE access
  if (isSuccess) {
    return (
      <div className="auth-view auth-view--active" role="status" aria-live="polite">
        <div className="success-icon-wrapper">
          <div className="success-checkmark-circle">
            <CheckCircle2 size={54} className="success-checkmark-svg" />
          </div>
        </div>
        <h2 className="auth-view__title" style={{ marginTop: '1.25rem', color: 'var(--good)' }}>
          Account Active
        </h2>
        <p className="auth-view__subtitle" style={{ maxWidth: '420px', margin: '0.75rem auto 1.5rem' }}>
          Welcome to ChaseHorse Field Ops, <strong>{companyName}</strong>. Your enterprise portal is ready to create, dispatch, and monitor nationwide field tasks.
        </p>

        <div className="pending-details-box">
          <div className="pending-detail-row">
            <span>Primary Contact:</span>
            <strong>{contactName}</strong>
          </div>
          <div className="pending-detail-row">
            <span>Work Email:</span>
            <strong>{email}</strong>
          </div>
          <div className="pending-detail-row">
            <span>Status:</span>
            <span className="badge badge--success">INSTANT ACTIVE ACCESS</span>
          </div>
        </div>

        <div className="pending-actions-row">
          <button
            type="button"
            onClick={handleLaunchDashboard}
            className="btn btn--primary btn--block btn--sheen"
          >
            Go to Customer Dashboard <ArrowRight size={16} className="btn-arrow" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-view">
      <div className="auth-view__header">
        <h2 id="auth-modal-title" className="auth-view__title">
          Register as Business Customer
        </h2>
        <p className="auth-view__subtitle">
          Create pan-India field tasks, track on-site execution in real time, and inspect AI-verified proof.
        </p>
      </div>

      {serverError && (
        <div className="auth-banner auth-banner--error" role="alert">
          <AlertCircle size={18} className="auth-banner__icon" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <FormField
          id="customer-company"
          label="Company / Enterprise Name"
          required
          error={companyError}
          isShaking={shakingField === 'company'}
          icon={<Building2 size={18} />}
        >
          <input
            id="customer-company"
            name="organization"
            type="text"
            autoComplete="organization"
            required
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              if (companyError) setCompanyError(null);
            }}
            onBlur={() => validateCompany(companyName)}
            placeholder="Apex Retail Brands Pvt Ltd"
            className="input input--with-icon"
            autoFocus
          />
        </FormField>

        <FormField
          id="customer-contact"
          label="Contact Person Name"
          required
          error={contactError}
          isShaking={shakingField === 'contact'}
          icon={<User size={18} />}
        >
          <input
            id="customer-contact"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={contactName}
            onChange={(e) => {
              setContactName(e.target.value);
              if (contactError) setContactError(null);
            }}
            onBlur={() => validateContact(contactName)}
            placeholder="Priya Nair"
            className="input input--with-icon"
          />
        </FormField>

        {/* Work Email + Phone Number */}
        <div className="auth-form__grid-2">
          <FormField
            id="customer-email"
            label="Work Email"
            required
            error={emailError}
            isShaking={shakingField === 'email'}
            icon={<Mail size={18} />}
          >
            <input
              id="customer-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onBlur={() => validateEmail(email)}
              placeholder="priya@apexretail.com"
              className="input input--with-icon"
            />
          </FormField>

          <FormField
            id="customer-phone"
            label="Phone Number"
            required
            error={phoneError}
            isShaking={shakingField === 'phone'}
            icon={<Phone size={18} />}
          >
            <input
              id="customer-phone"
              name="tel"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => {
                const clean = e.target.value.replace(/[^0-9+\s\-]/g, '');
                setPhone(clean);
                if (phoneError) setPhoneError(null);
              }}
              onBlur={() => validatePhone(phone)}
              placeholder="+91 99000 12345"
              className="input input--with-icon"
            />
          </FormField>
        </div>

        {/* Password + Confirm */}
        <div className="auth-form__grid-2">
          <PasswordField
            id="customer-password"
            name="new-password"
            label="Password"
            required
            value={password}
            onChange={(val) => {
              setPassword(val);
              if (passwordError) setPasswordError(null);
              if (confirmPassword && val !== confirmPassword) {
                setConfirmError('Passwords do not match.');
              } else if (confirmPassword && val === confirmPassword) {
                setConfirmError(null);
              }
            }}
            onBlur={() => validatePassword(password)}
            error={passwordError}
            isShaking={shakingField === 'password'}
            showStrengthMeter
            autoComplete="new-password"
          />

          <PasswordField
            id="customer-confirm-password"
            name="new-password-confirm"
            label="Confirm Password"
            required
            value={confirmPassword}
            onChange={(val) => {
              setConfirmPassword(val);
              if (confirmError) setConfirmError(null);
            }}
            onBlur={() => validateConfirmPassword(confirmPassword)}
            error={confirmError}
            isShaking={shakingField === 'confirm'}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn--primary btn--block btn--sheen"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spin" /> Creating Customer Account...
            </>
          ) : (
            <>
              Register as Customer <ArrowRight size={16} className="btn-arrow" />
            </>
          )}
        </button>
      </form>

      <div className="auth-view__footer-nav">
        <div className="auth-view__footer-link-group">
          <span>Already have an account?</span>
          <button
            type="button"
            onClick={() => onSwitchView('login')}
            className="link-action-btn link-action-btn--strong"
          >
            Sign In here
          </button>
        </div>
        <div className="auth-view__footer-link-group">
          <button
            type="button"
            onClick={() => onSwitchView('worker')}
            className="link-action-btn"
          >
            Looking to perform field work? Register as On-Field Worker →
          </button>
        </div>
      </div>
    </div>
  );
}
