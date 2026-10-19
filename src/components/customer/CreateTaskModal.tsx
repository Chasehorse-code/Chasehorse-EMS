import { useState, type FormEvent } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
} from 'lucide-react';
import { api } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Task, TaskCategory, TaskPriority } from '@/types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
}

const CATEGORIES: TaskCategory[] = [
  'Shelf audit',
  'Site survey',
  'Signage check',
  'Equipment inspection',
  'Delivery proof',
];

const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

export function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
  const { profile, user } = useAuth();
  const { notify } = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Task Details
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Shelf audit');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [description, setDescription] = useState('');

  // Step 2: Location & Schedule
  const [cityRegion, setCityRegion] = useState('Tenali Urban, Andhra Pradesh');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('16.2418');
  const [lng, setLng] = useState('80.6448');
  const [geoRadiusMeters, setGeoRadiusMeters] = useState('100');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(Date.now() + 2 * 86400000);
    return d.toISOString().slice(0, 16);
  });

  // Step 3: Reward & Eligibility
  const [rewardInr, setRewardInr] = useState('450');
  const [workerCount, setWorkerCount] = useState('1');
  const [eligibilityNote, setEligibilityNote] = useState('Approved On-Field Workers in Tenali/Guntur Cluster');

  // Step 4: Checklist & Evidence
  const [checklistItems, setChecklistItems] = useState<string[]>([
    'Verify storefront or physical facility presence',
    'Capture unobstructed wide-angle photo of asset/signage',
    'Confirm serial number / QR tag condition',
    'Record timestamp and ambient lighting observation',
  ]);
  const [newChecklistInput, setNewChecklistInput] = useState('');
  const [photoProofRequired, setPhotoProofRequired] = useState(true);
  const [geotagRequired, setGeotagRequired] = useState(true);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    if (newChecklistInput.trim()) {
      setChecklistItems([...checklistItems, newChecklistInput.trim()]);
      setNewChecklistInput('');
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const validateCurrentStep = (): boolean => {
    setError(null);
    if (step === 1) {
      if (title.trim().length < 5) {
        setError('Task title must be at least 5 characters long.');
        return false;
      }
      if (description.trim().length < 10) {
        setError('Please provide a descriptive objective (minimum 10 characters).');
        return false;
      }
    }
    if (step === 2) {
      if (!address.trim()) {
        setError('Please enter the street address or landmark.');
        return false;
      }
      if (!dueDate) {
        setError('Please choose a valid completion deadline.');
        return false;
      }
    }
    if (step === 3) {
      const reward = Number(rewardInr);
      if (isNaN(reward) || reward < 50) {
        setError('Minimum field task reward is ₹50.');
        return false;
      }
    }
    if (step === 4) {
      if (checklistItems.length === 0) {
        setError('Add at least one checklist step for the field worker to verify.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => (prev < 5 ? ((prev + 1) as any) : 5));
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as any) : 1));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setLoading(true);
    setError(null);

    const customerId = profile?.id || user?.id || 'cust-apex';

    try {
      const task = await api.createTask({
        title,
        description,
        category,
        priority,
        customerId,
        areaKey: cityRegion,
        address,
        dueAt: new Date(dueDate).toISOString(),
        rewardInr: Number(rewardInr),
        checklistTemplateId: 'chk-custom',
        locationLat: Number(lat) || 16.2418,
        locationLng: Number(lng) || 80.6448,
      });

      setCreatedTask(task);
      notify(`Task ${task.id} successfully published to field network!`, 'success');
      if (onTaskCreated) onTaskCreated(task);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish task. Please check server status.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 12, 24, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '16px',
          border: '1px solid var(--color-border, #334155)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--color-border, #334155)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.5)',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
              {createdTask ? 'Task Created Successfully' : 'Create Field Operations Task'}
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)' }}>
              Step {step} of 5 • Configurable Blueprint Task Orchestration
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn"
            style={{ color: '#94a3b8', cursor: 'pointer' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progress Indicators */}
        {!createdTask && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border, #334155)',
            background: 'rgba(15, 23, 42, 0.3)',
          }}>
            {[
              { num: 1, label: 'Details' },
              { num: 2, label: 'Location' },
              { num: 3, label: 'Reward' },
              { num: 4, label: 'Checklist' },
              { num: 5, label: 'Review' },
            ].map((s) => (
              <div
                key={s.num}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: step === s.num ? '#38bdf8' : step > s.num ? '#10b981' : '#64748b',
                  borderBottom: step === s.num ? '2px solid #38bdf8' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {step > s.num ? '✓ ' : `${s.num}. `}
                {s.label}
              </div>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Screen */}
          {createdTask ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                color: '#10b981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--color-text, #f8fafc)' }}>
                Field Task Published!
              </h3>
              <p style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                Your task has been committed to the dispatch queue and is now discoverable by verified on-field workers near the target coordinates.
              </p>
              <div style={{
                display: 'inline-block',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: '1.5rem',
              }}>
                Server Reference: {createdTask.id}
              </div>
              <div>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn--primary"
                  style={{ padding: '10px 24px' }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* STEP 1: Task Details */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                      Task Name / Headline <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Retail Storefront Banner & Planogram Compliance Audit"
                      className="input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TaskCategory)}
                        className="input"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                        Priority Level
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TaskPriority)}
                        className="input"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>{p.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                      Detailed Instructions for Field Worker <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Specify exact inspection steps, points of interest, lighting condition expectations, or barcode checks..."
                      className="input"
                      style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Location & Schedule */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                      Operating City / Region <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={cityRegion}
                      onChange={(e) => setCityRegion(e.target.value)}
                      placeholder="e.g. Tenali Urban, Andhra Pradesh"
                      className="input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                      Target Street Address / Landmark <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Shop #42, Main Bazaar Road, Near Old Town Bus Station"
                      className="input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                        Latitude
                      </label>
                      <input
                        type="text"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        className="input"
                        style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                        Longitude
                      </label>
                      <input
                        type="text"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        className="input"
                        style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                        Radius (meters)
                      </label>
                      <input
                        type="number"
                        value={geoRadiusMeters}
                        onChange={(e) => setGeoRadiusMeters(e.target.value)}
                        className="input"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                      Completion Deadline (SLA) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Reward & Eligibility */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                        Task Completion Reward (INR) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontWeight: 700 }}>
                          ₹
                        </span>
                        <input
                          type="number"
                          required
                          min={50}
                          value={rewardInr}
                          onChange={(e) => setRewardInr(e.target.value)}
                          className="input"
                          style={{ width: '100%', paddingLeft: '28px', boxSizing: 'border-box', fontWeight: 600 }}
                        />
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                        Transferred to worker's wallet ledger upon Operations Manager approval.
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                        Required Workers
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={workerCount}
                        onChange={(e) => setWorkerCount(e.target.value)}
                        className="input"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                      Worker Eligibility Criteria
                    </label>
                    <input
                      type="text"
                      value={eligibilityNote}
                      onChange={(e) => setEligibilityNote(e.target.value)}
                      className="input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{
                    padding: '0.875rem',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    fontSize: '0.8rem',
                    color: '#93c5fd',
                  }}>
                    <strong>Ledger Integrity Rule:</strong> Reward amounts are verified by backend business rules upon submission. Client-side tampering is prevented by backend validation.
                  </div>
                </div>
              )}

              {/* STEP 4: Checklist & Evidence */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: '#94a3b8' }}>
                      Field Worker Checklist Items ({checklistItems.length}) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={newChecklistInput}
                        onChange={(e) => setNewChecklistInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChecklistItem();
                          }
                        }}
                        placeholder="Add checklist verification step..."
                        className="input"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleAddChecklistItem}
                        className="btn btn--secondary btn--sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={14} /> Add Step
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      {checklistItems.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--color-border, #334155)',
                            fontSize: '0.8125rem',
                          }}
                        >
                          <span style={{ color: 'var(--color-text, #f8fafc)' }}>
                            {idx + 1}. {item}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(idx)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                            title="Remove step"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={photoProofRequired}
                        onChange={(e) => setPhotoProofRequired(e.target.checked)}
                      />
                      <span>Enforce In-App Live Camera Geotagged Photo Capture</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={geotagRequired}
                        onChange={(e) => setGeotagRequired(e.target.checked)}
                      />
                      <span>Enforce GPS Distance &lt; {geoRadiusMeters}m Proximity Validation</span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 5: Review & Submit */}
              {step === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--color-border, #334155)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>{category} • {priority.toUpperCase()} PRIORITY</span>
                      <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700 }}>₹{rewardInr}</span>
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text, #f8fafc)' }}>
                      {title}
                    </h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                      {description}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px' }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Location: </span>
                        <strong style={{ color: '#e2e8f0' }}>{cityRegion}</strong>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{address}</div>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Deadline: </span>
                        <strong style={{ color: '#e2e8f0' }}>{new Date(dueDate).toLocaleString()}</strong>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Geo-fence: ±{geoRadiusMeters}m</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
                      Checklist Items ({checklistItems.length})
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#cbd5e1' }}>
                      {checklistItems.map((c, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Modal Bottom Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '1.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--color-border, #334155)',
              }}>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn--secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn--primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Continue <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn--primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#059669',
                    }}
                  >
                    {loading ? 'Publishing Task to Field Network...' : 'Confirm & Publish Task →'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
