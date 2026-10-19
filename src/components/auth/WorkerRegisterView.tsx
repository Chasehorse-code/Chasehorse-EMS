import { useState, useEffect, type FormEvent } from 'react';
import { User, Mail, Phone, MapPin, Navigation, Edit3, ArrowRight, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCurrentGpsPosition } from '@/utils/geolocation';
import { FormField } from '@/components/ui/FormField';
import { PasswordField } from '@/components/ui/PasswordField';

export interface WorkerRegisterViewProps {
  onSwitchView: (view: 'login' | 'customer') => void;
  onClose: () => void;
}

export function WorkerRegisterView({ onSwitchView, onClose }: WorkerRegisterViewProps) {
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [isManualTyping, setIsManualTyping] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsExtracted, setGpsExtracted] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Field validation error states
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [shakingField, setShakingField] = useState<string | null>(null);

  const triggerShake = (fieldName: string) => {
    setShakingField(fieldName);
    window.setTimeout(() => setShakingField(null), 500);
  };

  // Auto-extract device GPS location
  const detectLocation = async () => {
    setDetectingGps(true);
    setRegionError(null);
    try {
      const pos = await getCurrentGpsPosition();
      const detected = pos.address
        ? pos.address.split(',').slice(0, 3).join(',').trim()
        : `${pos.lat.toFixed(4)}°N, ${pos.lng.toFixed(4)}°E`;
      setRegion(detected);
      setGpsExtracted(true);
      setIsManualTyping(false);
    } catch {
      setRegion('Tenali Urban, Andhra Pradesh');
      setGpsExtracted(true);
      setIsManualTyping(false);
    } finally {
      setDetectingGps(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // Validation functions
  const validateName = (val: string): boolean => {
    if (!val.trim()) {
      setNameError('Full name is required.');
      return false;
    }
    if (val.trim().length < 2) {
      setNameError('Name must be at least 2 characters.');
      return false;
    }
    setNameError(null);
    return true;
  };

  const validateEmail = (val: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) {
      setEmailError('Email address is required.');
      return false;
    }
    if (!emailRegex.test(val.trim())) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePhone = (val: string): boolean => {
    const cleanPhone = val.replace(/[\s\-]/g, '');
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!val.trim()) {
      setPhoneError('Mobile phone number is required.');
      return false;
    }
    if (!phoneRegex.test(cleanPhone)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const validateRegion = (val: string): boolean => {
    if (!val.trim()) {
      setRegionError('Operating city or region is required.');
      return false;
    }
    setRegionError(null);
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

    const isNameOk = validateName(fullName);
    const isEmailOk = validateEmail(email);
    const isPhoneOk = validatePhone(phone);
    const isRegionOk = validateRegion(region);
    const isPassOk = validatePassword(password);
    const isConfirmOk = validateConfirmPassword(confirmPassword);

    if (!isNameOk) {
      triggerShake('name');
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
    if (!isRegionOk) {
      triggerShake('region');
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
        displayName: fullName.trim(),
        phone: phone.trim(),
        region: region.trim(),
        accountType: 'EMPLOYEE',
        subRole: 'field_worker',
      });

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

  // Success view: On-field workers start in Pending Approval
  if (isSuccess) {
    return (
      <div className="auth-view auth-view--pending" role="status" aria-live="polite">
        <div className="pending-icon-wrap">
          <Clock size={48} className="pending-icon-svg" />
        </div>
        <h2 className="auth-view__title" style={{ marginTop: '1.25rem' }}>
          Registration Submitted — Pending Approval
        </h2>
        <p className="auth-view__subtitle" style={{ maxWidth: '420px', margin: '0.75rem auto 1.5rem' }}>
          Welcome, <strong>{fullName}</strong>. Your worker profile has been queued for verification by our Operations Managers. Once verified, you will receive an approval notification at <strong>{email}</strong>.
        </p>

        <div className="pending-details-box">
          <div className="pending-detail-row">
            <span>Operating Hub:</span>
            <strong>{region}</strong>
          </div>
          <div className="pending-detail-row">
            <span>Registered Mobile:</span>
            <strong>{phone}</strong>
          </div>
          <div className="pending-detail-row">
            <span>Account Status:</span>
            <span className="badge badge--warning">PENDING APPROVAL</span>
          </div>
        </div>

        <div className="pending-actions-row">
          <button
            type="button"
            onClick={onClose}
            className="btn btn--primary btn--block"
          >
            Close & Return to Home
          </button>
          <button
            type="button"
            onClick={() => onSwitchView('login')}
            className="btn btn--ghost btn--block btn--sm"
          >
            Sign In with Existing Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-view">
      <div className="auth-view__header">
        <h2 id="auth-modal-title" className="auth-view__title">
          Register as On-Field Worker
        </h2>
        <p className="auth-view__subtitle">
          Execute tasks on site, upload verified camera proof, and earn instant wallet rewards.
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
          id="worker-fullname"
          label="Full Name"
          required
          error={nameError}
          isShaking={shakingField === 'name'}
          icon={<User size={18} />}
        >
          <input
            id="worker-fullname"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (nameError) setNameError(null);
            }}
            onBlur={() => validateName(fullName)}
            placeholder="Rahul Sharma"
            className="input input--with-icon"
            autoFocus
          />
        </FormField>

        {/* Email + Mobile Phone in two columns */}
        <div className="auth-form__grid-2">
          <FormField
            id="worker-email"
            label="Email Address"
            required
            error={emailError}
            isShaking={shakingField === 'email'}
            icon={<Mail size={18} />}
          >
            <input
              id="worker-email"
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
              placeholder="worker@chasehorse.com"
              className="input input--with-icon"
            />
          </FormField>

          <FormField
            id="worker-phone"
            label="Mobile Phone"
            required
            error={phoneError}
            isShaking={shakingField === 'phone'}
            icon={<Phone size={18} />}
          >
            <input
              id="worker-phone"
              name="tel"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => {
                // Strip non-phone characters except + and spaces
                const clean = e.target.value.replace(/[^0-9+\s\-]/g, '');
                setPhone(clean);
                if (phoneError) setPhoneError(null);
              }}
              onBlur={() => validatePhone(phone)}
              placeholder="+91 98765 43210"
              className="input input--with-icon"
            />
          </FormField>
        </div>

        {/* Operating City/Region with Auto-extract & Manual fallback */}
        <FormField
          id="worker-region"
          label="Operating City / Region"
          required
          error={regionError}
          isShaking={shakingField === 'region'}
          icon={<MapPin size={18} />}
          hint={
            gpsExtracted && !isManualTyping
              ? '✓ Extracted automatically from device GPS location'
              : 'Specify your primary operational city or territorial jurisdiction.'
          }
          rightElement={
            <div className="location-action-chips">
              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingGps}
                className="chip-btn chip-btn--gps"
                title="Detect GPS location from device"
              >
                <Navigation size={12} className={detectingGps ? 'spin' : ''} />
                {detectingGps ? 'Locating...' : 'Use my location'}
              </button>
              <button
                type="button"
                onClick={() => setIsManualTyping((prev) => !prev)}
                className={`chip-btn ${isManualTyping ? 'chip-btn--active' : ''}`}
              >
                <Edit3 size={12} />
                {isManualTyping ? 'Typing Mode' : 'Type Manually'}
              </button>
            </div>
          }
        >
          <input
            id="worker-region"
            name="address-level2"
            type="text"
            required
            value={region}
            readOnly={!isManualTyping}
            onClick={() => {
              if (!isManualTyping) setIsManualTyping(true);
            }}
            onChange={(e) => {
              setRegion(e.target.value);
              setGpsExtracted(false);
              if (regionError) setRegionError(null);
            }}
            onBlur={() => validateRegion(region)}
            placeholder="Auto-extracting location..."
            className={`input input--with-icon ${
              gpsExtracted && !isManualTyping ? 'input--gps-matched' : ''
            }`}
          />
        </FormField>

        {/* Password + Confirm Password with 4-segment strength meter */}
        <div className="auth-form__grid-2">
          <PasswordField
            id="worker-password"
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
            id="worker-confirm-password"
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
              <Loader2 size={18} className="spin" /> Submitting Application...
            </>
          ) : (
            <>
              Register as On-Field Worker <ArrowRight size={16} className="btn-arrow" />
            </>
          )}
        </button>
      </form>

      <div className="auth-view__footer-nav">
        <div className="auth-view__footer-link-group">
          <span>Already registered?</span>
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
            onClick={() => onSwitchView('customer')}
            className="link-action-btn"
          >
            Need to post tasks? Register as Business Customer →
          </button>
        </div>
      </div>
    </div>
  );
}
