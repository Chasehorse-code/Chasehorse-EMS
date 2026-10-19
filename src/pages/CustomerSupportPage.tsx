import { useState } from 'react';
import { Phone, Mail, Send, CheckCircle2 } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/Card';
import { useToast } from '@/context/ToastContext';

export function CustomerSupportPage() {
  const { notify } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    notify('Support ticket created! A specialist will contact you within 15 minutes.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px' }}>
      <PageHeader
        title="Help & Operations Support"
        description="24x7 Enterprise assistance for field audit operations, worker dispatch exceptions, and billing support."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', marginBottom: '6px' }}>
            <Phone size={18} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Emergency Dispatch Hotline</h4>
          </div>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
            +91 80 4000 8900
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
            Toll-free 24/7 dedicated enterprise response
          </p>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginBottom: '6px' }}>
            <Mail size={18} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Operations Desk Email</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
            support@chasehorse.com
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
            SLA Response under 30 minutes
          </p>
        </Card>
      </div>

      <Card>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>
          Submit Priority Support Ticket
        </h3>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text, #f8fafc)' }}>Ticket #TKT-8941 Logged</h4>
            <p style={{ margin: '4px 0 1rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Your inquiry has been assigned to operations duty manager.
            </p>
            <button type="button" onClick={() => setSubmitted(false)} className="btn btn--secondary btn--sm">
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Geo-fence boundary expansion for Tenali station task"
                  className="input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                  Urgency
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High (Active Field Task)</option>
                  <option value="Urgent">Urgent (SLA Critical)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                Message / Details
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your query or issue with specific task ID references..."
                className="input"
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn--primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={15} /> Send Ticket
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
