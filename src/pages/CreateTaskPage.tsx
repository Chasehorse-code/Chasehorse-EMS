import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Send,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Notice, Skeleton } from '@/components/ui/States';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Fields';
import { OPERATIONAL_HUBS } from '@/config/locations';
import type { Task, TaskCategory, TaskPriority } from '@/types';

const CATEGORIES: TaskCategory[] = [
  'Shelf audit',
  'Site survey',
  'Signage check',
  'Equipment inspection',
  'Delivery proof',
];

const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

interface FormErrors {
  title?: string;
  category?: string;
  priority?: string;
  description?: string;
  areaKey?: string;
  address?: string;
  dueAt?: string;
  rewardInr?: string;
  templateId?: string;
}

export function CreateTaskPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { customerId: contextCustomerId } = useRole();
  const location = useLocation();

  // Load available checklist templates from the shared API client
  const checklistsState = useAsync(() => api.listChecklists(), []);
  const templates = checklistsState.data ?? [];

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Shelf audit');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [areaKey, setAreaKey] = useState('central');
  const [address, setAddress] = useState('');
  const [dueAt, setDueAt] = useState(() => {
    // Default to 48 hours from now formatted for datetime-local
    const target = new Date(Date.now() + 48 * 3600 * 1000);
    target.setMinutes(target.getMinutes() - target.getTimezoneOffset());
    return target.toISOString().slice(0, 16);
  });
  const [rewardInr, setRewardInr] = useState('450');
  const [templateOverride, setTemplateOverride] = useState('');

  // Form UI states
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  // Derive template selection
  const templateId =
    templateOverride || templates.find((t) => t.category === category)?.id || templates[0]?.id || '';
  const selectedTemplate = templates.find((t) => t.id === templateId);

  // Customer identity
  const customerId = user?.id || profile?.id || contextCustomerId || 'cust-apex';

  // 1. Unauthenticated gate: Block users who are not logged in
  if (!authLoading && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Auth loading state
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader title="Create Field Task" description="Resolving user session..." />
        <Card>
          <Skeleton lines={6} />
        </Card>
      </div>
    );
  }

  // Validation function
  function validateForm(): FormErrors {
    const errs: FormErrors = {};

    if (!title.trim()) {
      errs.title = 'Task title is required.';
    } else if (title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters.';
    }

    if (!category) {
      errs.category = 'Task category is required.';
    }

    if (!priority) {
      errs.priority = 'Priority level is required.';
    }

    if (!description.trim()) {
      errs.description = 'Task instructions / scope of work are required.';
    } else if (description.trim().length < 10) {
      errs.description = 'Please provide detailed instructions (at least 10 characters).';
    }

    if (!areaKey) {
      errs.areaKey = 'Operational area / hub is required.';
    }

    if (!address.trim()) {
      errs.address = 'Store address or location landmark is required.';
    }

    if (!dueAt) {
      errs.dueAt = 'Due date and time is required.';
    } else {
      const dueTimestamp = new Date(dueAt).getTime();
      if (Number.isNaN(dueTimestamp)) {
        errs.dueAt = 'Please enter a valid date and time.';
      } else if (dueTimestamp <= Date.now()) {
        errs.dueAt = 'Due date must be in the future.';
      }
    }

    const rewardNum = Number(rewardInr);
    if (!rewardInr || rewardInr.trim() === '') {
      errs.rewardInr = 'Reward amount is required.';
    } else if (Number.isNaN(rewardNum) || rewardNum < 50) {
      errs.rewardInr = 'Reward must be a valid amount of at least ₹50.';
    }

    if (!templateId) {
      errs.templateId = 'A checklist template is required.';
    }

    return errs;
  }

  // Form submission handler using shared API client
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNetworkError(null);

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    const selectedHub = OPERATIONAL_HUBS[areaKey] || OPERATIONAL_HUBS.central;

    try {
      const task = await api.createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        customerId,
        areaKey,
        address: address.trim(),
        dueAt: new Date(dueAt).toISOString(),
        rewardInr: Number(rewardInr),
        checklistTemplateId: templateId,
        locationLat: selectedHub.lat,
        locationLng: selectedHub.lng,
      });

      // ONLY set after the server successfully returns the created task record
      setCreatedTask(task);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to submit task to server. Please check your network connection and try again.';
      setNetworkError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setTitle('');
    setDescription('');
    setCategory('Shelf audit');
    setPriority('normal');
    setAreaKey('central');
    setAddress('');
    const target = new Date(Date.now() + 48 * 3600 * 1000);
    target.setMinutes(target.getMinutes() - target.getTimezoneOffset());
    setDueAt(target.toISOString().slice(0, 16));
    setRewardInr('450');
    setTemplateOverride('');
    setErrors({});
    setNetworkError(null);
    setCreatedTask(null);
  }

  // If successfully created and confirmed by server: Show success state
  if (createdTask) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <PageHeader
          title="Task Created Successfully"
          description="Your field task has been confirmed by the server and is now active in the system."
        />

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2.5rem 1rem', gap: '1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-bg, #dcfce7)',
                color: 'var(--success-fg, #15803d)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <CheckCircle2 size={36} aria-hidden />
            </div>

            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
              Task Request Published!
            </h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: '50ch', fontSize: '0.95rem' }}>
              Reference ID: <strong>{createdTask.id}</strong> — "{createdTask.title}" has been registered and is now open for field execution and evidence gathering.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
              <Link to="/tasks" className="btn btn--primary btn--md">
                View in Tasks
              </Link>
              <Button variant="secondary" onClick={handleReset} icon={<Plus size={16} />}>
                Create Another Task
              </Button>
              <Link to="/customer/dashboard" className="btn btn--ghost btn--md">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <PageHeader
        title="Create Field Task Request"
        description="Submit a verified field operation request. Field workers in the operational zone will receive instructions and complete required photo checklists."
        actions={
          <Link to="/tasks" className="btn btn--ghost btn--md">
            <span className="btn__icon" aria-hidden>
              <ArrowLeft size={16} />
            </span>
            Back to tasks
          </Link>
        }
      />

      {/* Network Error Alert */}
      {networkError && (
        <Notice tone="warning" title="Submission Failed">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: 0 }}>{networkError}</p>
            <div>
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                Retry Submission
              </Button>
            </div>
          </div>
        </Notice>
      )}

      <div className="grid grid--form">
        {/* Left Column: Form Fields */}
        <Card aria-labelledby="task-form-title">
          <CardHeader
            id="task-form-title"
            title="Task Details"
            subtitle="Specify the campaign requirements, location, and worker bounty"
          />

          <form onSubmit={handleSubmit} noValidate className="form">
            {/* Task Title */}
            <TextField
              label="Task Title"
              required
              value={title}
              disabled={isSubmitting}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              error={errors.title}
              placeholder="e.g. Retail Shelf Facing & Planogram Audit"
              hint="Concise title summarizing what needs to be verified."
            />

            {/* Category & Priority */}
            <div className="form__row">
              <SelectField
                label="Category"
                required
                value={category}
                disabled={isSubmitting}
                onChange={(e) => {
                  const newCategory = e.target.value as TaskCategory;
                  setCategory(newCategory);
                  setTemplateOverride('');
                  if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                error={errors.category}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Priority"
                required
                value={priority}
                disabled={isSubmitting}
                onChange={(e) => {
                  setPriority(e.target.value as TaskPriority);
                  if (errors.priority) setErrors((prev) => ({ ...prev, priority: undefined }));
                }}
                error={errors.priority}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </SelectField>
            </div>

            {/* Scope / Instructions */}
            <TextAreaField
              label="Task Instructions / Scope of Work"
              required
              rows={4}
              value={description}
              disabled={isSubmitting}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              error={errors.description}
              placeholder="Describe the exact items to check, angles to photograph, and guidelines for the field worker..."
              hint="Displayed directly on the worker's mobile execution app."
            />

            {/* Location Area & Street Address */}
            <div className="form__row">
              <SelectField
                label="Operational Area / Hub"
                required
                value={areaKey}
                disabled={isSubmitting}
                onChange={(e) => {
                  setAreaKey(e.target.value);
                  if (errors.areaKey) setErrors((prev) => ({ ...prev, areaKey: undefined }));
                }}
                error={errors.areaKey}
              >
                {Object.entries(OPERATIONAL_HUBS).map(([key, hub]) => (
                  <option key={key} value={key}>
                    {hub.name}
                  </option>
                ))}
              </SelectField>

              <TextField
                label="Store Address / Landmark"
                required
                value={address}
                disabled={isSubmitting}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                }}
                error={errors.address}
                placeholder="e.g. Supermarket #14, Main Road"
              />
            </div>

            {/* Due Date & Reward */}
            <div className="form__row">
              <TextField
                label="Due Date & Time"
                type="datetime-local"
                required
                value={dueAt}
                disabled={isSubmitting}
                onChange={(e) => {
                  setDueAt(e.target.value);
                  if (errors.dueAt) setErrors((prev) => ({ ...prev, dueAt: undefined }));
                }}
                error={errors.dueAt}
              />

              <TextField
                label="Worker Reward (₹ INR)"
                type="number"
                inputMode="numeric"
                min={50}
                step={10}
                required
                value={rewardInr}
                disabled={isSubmitting}
                onChange={(e) => {
                  setRewardInr(e.target.value);
                  if (errors.rewardInr) setErrors((prev) => ({ ...prev, rewardInr: undefined }));
                }}
                error={errors.rewardInr}
                hint="Minimum ₹50 bounty per verified completion."
              />
            </div>

            {/* Checklist Template Selector */}
            <SelectField
              label="Verification Checklist Template"
              required
              value={templateId}
              disabled={isSubmitting || checklistsState.loading}
              onChange={(e) => {
                setTemplateOverride(e.target.value);
                if (errors.templateId) setErrors((prev) => ({ ...prev, templateId: undefined }));
              }}
              error={errors.templateId}
              hint="Checklist steps the on-field worker must complete."
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.category})
                </option>
              ))}
            </SelectField>

            {/* Form Action Buttons */}
            <div className="form__actions" style={{ marginTop: '1rem' }}>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                icon={isSubmitting ? undefined : <Send size={16} />}
              >
                {isSubmitting ? 'Submitting Task Request...' : 'Publish Task Request'}
              </Button>
              <Link to="/tasks" className="btn btn--secondary btn--md">
                Cancel
              </Link>
            </div>
          </form>
        </Card>

        {/* Right Column: Live Checklist Preview */}
        <div className="stack" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card aria-labelledby="preview-heading">
            <CardHeader
              id="preview-heading"
              title="Evidence Checklist Preview"
              subtitle={selectedTemplate ? selectedTemplate.name : 'Loading template...'}
            />

            {checklistsState.loading ? (
              <Skeleton lines={4} />
            ) : selectedTemplate ? (
              <ol className="preview-list" style={{ listStylePosition: 'inside', paddingLeft: 0, margin: 0 }}>
                {selectedTemplate.items.map((item) => (
                  <li
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '13.5px',
                    }}
                  >
                    <span>{item.label}</span>
                    <span className="chips" style={{ display: 'flex', gap: '4px' }}>
                      {item.required ? (
                        <span className="chip chip--strong">Required</span>
                      ) : (
                        <span className="chip">Optional</span>
                      )}
                      {item.requiresPhoto && (
                        <span className="chip chip--photo">
                          <Camera size={11} aria-hidden /> Photo Proof
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                No checklist template found for this category.
              </p>
            )}
          </Card>

          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)' }}>Customer Portal Notice</strong>
              <p style={{ margin: 0 }}>
                Your task request will be published to the field operations network. Field workers within the selected hub will accept and execute the task with geotagged evidence and automated AI verification.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
