import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Notice, Skeleton } from '@/components/ui/States';
import { TextField } from '@/components/ui/Fields';

interface ProfileErrors {
  displayName?: string;
  phone?: string;
  companyName?: string;
  region?: string;
}

export function CustomerProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const location = useLocation();

  // Form Fields initialized from server-verified profile
  const [displayName, setDisplayName] = useState(() => profile?.displayName || '');
  const [phone, setPhone] = useState(() => profile?.phone || '');
  const [region, setRegion] = useState(() => profile?.region || 'Tenali / Regional Cluster');
  const [companyName, setCompanyName] = useState('Apex Retail Brands Pvt Ltd');

  // UI state
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // 1. Unauthenticated gate: Block users who are not logged in
  if (!authLoading && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Auth loading state
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '820px' }}>
        <PageHeader title="Customer Profile" description="Loading account details..." />
        <Card>
          <Skeleton lines={6} />
        </Card>
      </div>
    );
  }

  // Validation function
  function validateForm(): ProfileErrors {
    const errs: ProfileErrors = {};

    if (!displayName.trim()) {
      errs.displayName = 'Contact person name is required.';
    } else if (displayName.trim().length < 2) {
      errs.displayName = 'Name must be at least 2 characters.';
    }

    if (!companyName.trim()) {
      errs.companyName = 'Company name is required.';
    }

    if (!phone.trim()) {
      errs.phone = 'Mobile phone number is required.';
    } else {
      // Basic phone format validation (digits, optional leading plus, spaces)
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        errs.phone = 'Please enter a valid 10-digit phone number.';
      }
    }

    if (!region.trim()) {
      errs.region = 'Operating region is required.';
    }

    return errs;
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaveSuccess(false);
    setServerError(null);

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      // The backend ProfileController currently lacks a PUT /api/v1/profiles/me endpoint.
      // We attempt to verify server connectivity and simulate standard API call failure if unsupported.
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${API_BASE}/profiles/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          companyName: companyName.trim(),
          phone: phone.trim(),
          region: region.trim(),
        }),
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 405) {
          throw new Error(
            'Backend profile persistence endpoint (PUT /api/v1/profiles/me) is not yet implemented on the server.',
          );
        }
        throw new Error(`Server returned HTTP ${res.status} while saving profile.`);
      }

      // ONLY show saved after the server actually confirms it
      setSaveSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Network error: Failed to save profile changes to server. Please check your connection and retry.';
      setServerError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '820px' }}>
      <PageHeader
        title="Customer Profile & Organization Settings"
        description="Manage your enterprise contact information, operating region, and verified account credentials."
      />

      {/* Network / Server Error Notice */}
      {serverError && (
        <Notice tone="warning" title="Save Failed">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: 0 }}>{serverError}</p>
            <div>
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={handleSave}
                disabled={isSaving}
              >
                Retry Saving
              </Button>
            </div>
          </div>
        </Notice>
      )}

      {/* Confirmed Success State */}
      {saveSuccess && (
        <Notice tone="info" title="Profile Confirmed by Server">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} />
            <span>Your enterprise profile details have been successfully verified and saved on the server.</span>
          </div>
        </Notice>
      )}

      <Card aria-labelledby="profile-form-heading">
        <CardHeader
          id="profile-form-heading"
          title="Account Information"
          subtitle="Customer identity parameters associated with published tasks"
          actions={
            <Badge tone="success">
              {profile?.accountStatus || 'ACTIVE ENTERPRISE'}
            </Badge>
          }
        />

        <form onSubmit={handleSave} noValidate className="form">
          {/* Read-Only Verified Account Email */}
          <TextField
            label="Verified Work Email"
            type="email"
            disabled
            value={user?.email || profile?.email || ''}
            hint="Email authentication identifier (read-only, managed via Supabase Auth)."
          />

          {/* Company Name */}
          <TextField
            label="Company / Enterprise Name"
            required
            value={companyName}
            disabled={isSaving}
            onChange={(e) => {
              setCompanyName(e.target.value);
              if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: undefined }));
            }}
            error={errors.companyName}
            placeholder="e.g. Apex Retail Brands Pvt Ltd"
          />

          {/* Contact Person & Phone */}
          <div className="form__row">
            <TextField
              label="Primary Contact Person"
              required
              value={displayName}
              disabled={isSaving}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: undefined }));
              }}
              error={errors.displayName}
              placeholder="e.g. Rahul Kumar"
            />

            <TextField
              label="Mobile Phone"
              type="tel"
              required
              value={phone}
              disabled={isSaving}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              error={errors.phone}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          {/* Region */}
          <TextField
            label="Primary Operating Region / District"
            required
            value={region}
            disabled={isSaving}
            onChange={(e) => {
              setRegion(e.target.value);
              if (errors.region) setErrors((prev) => ({ ...prev, region: undefined }));
            }}
            error={errors.region}
            placeholder="e.g. Krishna & Guntur Cluster"
          />

          {/* Security Notice */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            <ShieldCheck size={18} style={{ color: 'var(--good, #10b981)', flexShrink: 0 }} aria-hidden />
            <span>
              Passwords, session tokens, and cryptographic keys are strictly managed via Supabase OAuth / JWT and are never exposed in localStorage.
            </span>
          </div>

          <div className="form__actions" style={{ marginTop: '1rem' }}>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              icon={isSaving ? undefined : <Save size={16} />}
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
