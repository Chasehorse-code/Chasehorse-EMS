import { useState } from 'react';
import { Building2, User, Mail, Phone, ShieldCheck, Save } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function CustomerProfilePage() {
  const { profile, user } = useAuth();
  const { notify } = useToast();

  const [companyName, setCompanyName] = useState('Apex Retail Brands Pvt Ltd');
  const [contactPerson, setContactPerson] = useState(profile?.displayName || 'Rahul Kumar');
  const [email] = useState(user?.email || 'rahul.kumar@apexretail.com');
  const [phone, setPhone] = useState(profile?.phone || '+91 99000 12345');
  const [gstin, setGstin] = useState('37AAACA1234F1Z8');
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      notify('Enterprise profile and billing preferences updated!', 'success');
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
      <PageHeader
        title="Enterprise Profile & Settings"
        description="Manage company details, authorized billing identifiers, notification hooks, and security preferences."
      />

      <Card>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
              Company / Registered Legal Entity Name
            </label>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input"
                style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                Primary Contact Person
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="input"
                  style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                Verified Work Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="input"
                  style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box', opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                Mobile Phone
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                GSTIN / Tax Identification
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="input"
                style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.825rem',
            color: '#6ee7b7',
          }}>
            <ShieldCheck size={20} />
            <span>Account Status: <strong>ACTIVE & VERIFIED ENTERPRISE</strong> (Authorized for instant field task publication and nationwide SLA dispatches).</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn--primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={16} />
              {saving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
