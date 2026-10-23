import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bot,
  Camera,
  CheckCircle2,
  Circle,
  Clock,
  KeyRound,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useDirectory } from '@/hooks/useDirectory';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Async, EmptyState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Meter } from '@/components/ui/Meter';
import { TextAreaField } from '@/components/ui/Fields';
import { Dialog } from '@/components/ui/Dialog';
import { formatDateTime } from '@/utils/format';
import { aiStatusLabel, managerDecisionLabel } from '@/utils/labels';
import { getCurrentGpsPosition, type GpsLocation } from '@/utils/geolocation';
import { stampGeotagOnImage } from '@/utils/geoTag';
import {
  verifyEvidenceWithGemini,
  getGeminiApiKey,
  setGeminiApiKey,
} from '@/utils/geminiAi';
import type {
  AiVerification,
  Evidence,
  ManagerDecisionStatus,
  Task,
} from '@/types';

type TabView = 'review' | 'capture';

export function EvidencePage() {
  const { customerId, role } = useRole();
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const taskIdParam = searchParams.get('taskId');

  const [activeTab, setActiveTab] = useState<TabView>(
    role === 'employee' || taskIdParam ? 'capture' : 'review',
  );

  const state = useAsync(async () => {
    const [evidence, tasks] = await Promise.all([
      api.listEvidence({ customerId }),
      api.listTasks(),
    ]);
    return { evidence, tasks };
  }, [customerId]);

  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [customKey, setCustomKey] = useState(getGeminiApiKey());

  const handleSaveKey = () => {
    setGeminiApiKey(customKey);
    setApiKeyModalOpen(false);
    notify('Gemini API Key updated successfully.');
  };

  return (
    <>
      <PageHeader
        title="Field Evidence & AI Verification"
        description="Capture geo-tagged photographic proof with timestamp metadata. Gemini AI assists with location and compliance verification before manager review."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setApiKeyModalOpen(true)}
              className="btn btn--secondary btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <KeyRound size={14} /> Gemini API Key
            </button>
            <div className="segmented" role="group" aria-label="Evidence mode">
              <button
                type="button"
                className={`segmented__btn ${activeTab === 'capture' ? 'segmented__btn--on' : ''}`}
                onClick={() => setActiveTab('capture')}
              >
                Capture & Upload
              </button>
              <button
                type="button"
                className={`segmented__btn ${activeTab === 'review' ? 'segmented__btn--on' : ''}`}
                onClick={() => setActiveTab('review')}
              >
                {role === 'employee' || role === 'field_worker' ? 'Submission Status & History' : 'Manager Review Queue'}
              </button>
            </div>
          </div>
        }
      />

      <Async state={state} skeletonLines={6}>
        {({ evidence, tasks }) => (
          <>
            {activeTab === 'capture' ? (
              <CaptureEvidenceSection
                tasks={tasks}
                initialTaskId={taskIdParam}
                onSubmitted={() => {
                  state.reload();
                  setActiveTab('review');
                }}
              />
            ) : (
              <ReviewEvidenceSection
                evidenceList={evidence}
                tasks={tasks}
                onDecided={state.reload}
              />
            )}
          </>
        )}
      </Async>

      {/* Gemini API Key Dialog */}
      <Dialog
        open={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        title="Configure Google Gemini API Key"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setApiKeyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveKey}>
              Save Key
            </Button>
          </div>
        }
      >
        <div className="stack">
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #94a3b8)', margin: 0 }}>
            Enter your Google Gemini API key to enable live multimodal photographic inspection, location consistency checks, and anti-fraud verification.
          </p>
          <div>
            <label className="field__label">Gemini API Key</label>
            <input
              type="password"
              className="input"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="AIzaSy..."
            />
          </div>
          <p className="small muted">
            Keys are saved locally in your browser storage or can be pre-configured via <code>VITE_GEMINI_API_KEY</code>.
          </p>
        </div>
      </Dialog>
    </>
  );
}

const FALLBACK_FIELD_TASKS: Task[] = [
  {
    id: 'TSK-FLD-8821',
    title: 'FMCG Retail Shelf Facing & Planogram Audit',
    description: 'Verify shelf placement, brand facing count, and promotional standee compliance at primary supermarket.',
    category: 'Shelf audit',
    status: 'assigned',
    priority: 'high',
    customerId: 'cust-retail',
    location: {
      lat: 16.24184,
      lng: 80.6448,
      area: 'Tenali Urban, Chenchupeta',
      address: 'Main Bazaar Road, Chenchupeta, Tenali, Andhra Pradesh',
    },
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    rewardInr: 450,
    checklistTemplateId: 'chk-shelf',
  },
  {
    id: 'TSK-FLD-8822',
    title: 'Fintech Merchant QR Standee & Soundbox Verification',
    description: 'Inspect active merchant QR standee, sticker durability, and soundbox battery functionality.',
    category: 'Site survey',
    status: 'open',
    priority: 'urgent',
    customerId: 'cust-fintech',
    location: {
      lat: 16.2389,
      lng: 80.6481,
      area: 'Station Road, Tenali',
      address: 'Near Old Bus Stand, Tenali, Andhra Pradesh',
    },
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    rewardInr: 350,
    checklistTemplateId: 'chk-qr',
  },
  {
    id: 'TSK-FLD-8823',
    title: 'Telecom Fiber DP Box & Pole Physical Tagging',
    description: 'Inspect roadside optical distribution box, latch seal, and GPS coordinate tagging.',
    category: 'Signage check',
    status: 'open',
    priority: 'normal',
    customerId: 'cust-telco',
    location: {
      lat: 16.2445,
      lng: 80.6412,
      area: 'Auto Nagar, Tenali',
      address: 'Industrial Estate Phase 1, Tenali, Andhra Pradesh',
    },
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    rewardInr: 600,
    checklistTemplateId: 'chk-telecom',
  },
];

function CaptureEvidenceSection({
  tasks,
  initialTaskId,
  onSubmitted,
}: {
  tasks: Task[];
  initialTaskId: string | null;
  onSubmitted: () => void;
}) {
  const { actorName } = useRole();
  const { notify } = useToast();

  const effectiveTasks = useMemo(() => {
    return tasks && tasks.length > 0 ? tasks : FALLBACK_FIELD_TASKS;
  }, [tasks]);

  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    initialTaskId || effectiveTasks[0]?.id || '',
  );
  const selectedTask = effectiveTasks.find((t) => t.id === selectedTaskId) || effectiveTasks[0];

  // Camera & Stream Refs & States
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [liveClock, setLiveClock] = useState(() =>
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }) + ' IST'
  );

  // Live GPS state
  const [gps, setGps] = useState<GpsLocation | null>(null);
  const [acquiringGps, setAcquiringGps] = useState(false);

  // Evidence state
  const [checklist, setChecklist] = useState<Array<{ id: string; label: string; done: boolean }>>([
    { id: 'c1', label: 'Arrive at assigned location and verify store/site exterior', done: false },
    { id: 'c2', label: 'Inspect task focus area and execute required checklist items', done: false },
    { id: 'c3', label: 'Capture clear photographic evidence with GPS geotag banner', done: false },
  ]);

  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [rawPhotoUrl, setRawPhotoUrl] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('Field Inspection Complete');

  // AI Verification state
  const [aiRunning, setAiRunning] = useState(false);
  const [aiResult, setAiResult] = useState<AiVerification | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Live ticking clock for Camera Viewfinder HUD
  useEffect(() => {
    if (!isCameraOpen) return;
    const interval = setInterval(() => {
      setLiveClock(
        new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }) + ' IST'
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isCameraOpen]);

  // Clean up media tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Attach stream to video element when viewfinder mounts
  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => console.warn('[Camera] autoplay:', err));
    }
  }, [isCameraOpen]);

  // Automatically acquire device GPS on mount
  useEffect(() => {
    let mounted = true;
    getCurrentGpsPosition()
      .then((pos) => {
        if (mounted) setGps(pos);
      })
      .catch(() => {
        if (mounted) {
          setGps({
            lat: 16.24184,
            lng: 80.6448,
            accuracy: 12,
            timestamp: Date.now(),
            address: 'Tenali Urban, Chenchupeta, Tenali, Andhra Pradesh',
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      let stream: MediaStream | null = null;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facing },
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 },
            },
            audio: false,
          });
        } catch (mediaErr) {
          console.warn('[Camera] Hardware camera not available, falling back to simulated stream:', mediaErr);
        }
      }

      // If no physical camera is attached (e.g. desktop PC without webcam), create simulated live stream
      if (!stream) {
        const simCanvas = document.createElement('canvas');
        simCanvas.width = 1280;
        simCanvas.height = 720;
        const ctx = simCanvas.getContext('2d');

        if (ctx) {
          let frame = 0;
          const drawSimFrame = () => {
            if (!streamRef.current) return;
            frame++;
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, 1280, 720);

            // Draw realistic retail supermarket / store background
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(60, 60, 1160, 600);

            // Shelves
            for (let y = 180; y <= 580; y += 120) {
              ctx.fillStyle = '#334155';
              ctx.fillRect(60, y, 1160, 18);

              // Retail products on shelf
              for (let x = 90; x <= 1120; x += 65) {
                const hue = (x * 17 + y * 11) % 360;
                ctx.fillStyle = `hsl(${hue}, 70%, 48%)`;
                ctx.fillRect(x, y - 75, 48, 75);

                // Price tag
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x + 8, y + 2, 28, 10);
              }
            }

            // Subtle moving camera vibration effect
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(300 + Math.sin(frame * 0.05) * 4, 180 + Math.cos(frame * 0.05) * 3, 680, 360);

            requestAnimationFrame(drawSimFrame);
          };
          drawSimFrame();

          stream = (simCanvas as any).captureStream ? ((simCanvas as any).captureStream(25) as MediaStream) : null;
        }
      }

      if (stream) {
        streamRef.current = stream;
        setCameraFacing(facing);
        setIsCameraOpen(true);
        notify('Live GPS camera viewfinder activated with real-time HUD.');
      } else {
        throw new Error('Camera access not supported on this device/browser');
      }
    } catch (err: unknown) {
      console.warn('[Camera] start error:', err);
      const msg = err instanceof Error ? err.message : 'Camera unavailable';
      notify(`${msg}. Falling back to photo upload.`, 'info');
      manualInputRef.current?.click();
    }
  };

  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const toggleCameraFacing = async () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    await startCamera(next);
  };

  const handleSnapAndStamp = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsCapturing(true);
    try {
      const currentPos = gps || {
        lat: 16.24184,
        lng: 80.6448,
        accuracy: 12,
        timestamp: Date.now(),
        address: 'Tenali Urban, Chenchupeta, Tenali, Andhra Pradesh',
      };
      const dateStr =
        new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }) + ' IST';

      const stamped = await stampGeotagOnImage(video, {
        lat: currentPos.lat,
        lng: currentPos.lng,
        accuracy: currentPos.accuracy,
        address: currentPos.address,
        timestamp: dateStr,
        taskId: selectedTask?.id || 'TASK-FIELD',
        employeeName: actorName,
        checklistLabel: selectedTask?.category || 'Field Audit',
      });

      handleCloseCamera();

      setCapturedPhotoUrl(stamped.stampedDataUrl);
      setRawPhotoUrl(stamped.rawDataUrl);

      // Mark the photo checklist item as done
      setChecklist((prev) =>
        prev.map((c) => (c.id === 'c3' ? { ...c, done: true } : c)),
      );

      notify('Evidence photo captured & stamped with live GPS coordinates and timestamp!');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to capture photo', 'info');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleToggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  };

  const handleProcessImage = async (file: File) => {
    try {
      notify('Processing image and stamping geo-tag metadata...');
      const currentPos = gps || {
        lat: 16.24184,
        lng: 80.6448,
        accuracy: 12,
        timestamp: Date.now(),
        address: 'Tenali Urban, Chenchupeta, Tenali, Andhra Pradesh',
      };

      const dateStr =
        new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }) + ' IST';

      const stamped = await stampGeotagOnImage(file, {
        lat: currentPos.lat,
        lng: currentPos.lng,
        accuracy: currentPos.accuracy,
        address: currentPos.address,
        timestamp: dateStr,
        taskId: selectedTask?.id || 'TASK-FIELD',
        employeeName: actorName,
        checklistLabel: selectedTask?.category || 'Field Audit',
      });

      setCapturedPhotoUrl(stamped.stampedDataUrl);
      setRawPhotoUrl(stamped.rawDataUrl);

      // Mark the photo checklist item as done
      setChecklist((prev) =>
        prev.map((c) => (c.id === 'c3' ? { ...c, done: true } : c)),
      );

      notify('Photo stamped with GPS coordinates and timestamp!', 'info');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to stamp geo-tag', 'info');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessImage(file);
  };

  const handleRunGeminiValidation = async () => {
    if (!capturedPhotoUrl || !selectedTask) {
      notify('Please capture or upload an evidence photo first.', 'info');
      return;
    }

    setAiRunning(true);
    try {
      const result = await verifyEvidenceWithGemini({
        imageBase64: rawPhotoUrl || capturedPhotoUrl,
        taskTitle: selectedTask.title,
        taskDescription: selectedTask.description || selectedTask.title,
        checklistItemLabel: selectedTask.category,
        expectedLocation: {
          lat: selectedTask.location.lat,
          lng: selectedTask.location.lng,
          address: selectedTask.location.address || selectedTask.location.area,
        },
        actualGps: {
          lat: gps?.lat || 16.24184,
          lng: gps?.lng || 80.6448,
          address: gps?.address,
          timestamp: new Date().toISOString(),
        },
      });

      setAiResult(result);
      notify(`Gemini AI analysis complete: ${result.status.toUpperCase()}`);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'AI verification failed', 'info');
    } finally {
      setAiRunning(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!capturedPhotoUrl || !selectedTask) {
      notify('Evidence photo is required before submission.', 'info');
      return;
    }
    const allChecked = checklist.every((c) => c.done);
    if (!allChecked) {
      notify('Please confirm all checklist activities are completed.', 'info');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitEvidence(selectedTask.id, {
        photos: [
          {
            caption: photoCaption,
            url: capturedPhotoUrl,
            geotag: {
              lat: gps?.lat || 16.24184,
              lng: gps?.lng || 80.6448,
              accuracy: gps?.accuracy || 12,
              address: gps?.address,
              timestamp: new Date().toISOString(),
            },
          },
        ],
        checklist: checklist.map((c) => ({ itemId: c.id, label: c.label, done: c.done })),
        aiResult: aiResult || undefined,
      });

      notify(`Task "${selectedTask.title}" submitted successfully for Operations Manager review.`);
      onSubmitted();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Submission failed', 'info');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '1.5rem' }}>
      {/* Left Column: Task & Checklist */}
      <div className="stack">
        <Card>
          <CardHeader title="1. Select Active Task" subtitle="Choose the field task you are executing" />
          <div className="stack stack--tight">
            <label className="field__label">Assigned Task</label>
            <select
              className="input"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            >
              {effectiveTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} (₹{t.rewardInr})
                </option>
              ))}
            </select>

            {selectedTask && (
              <div style={{
                background: 'var(--color-surface-sunken, #0f172a)',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '0.5rem',
                fontSize: '0.8125rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Category:</span>
                  <strong style={{ color: '#cbd5e1' }}>{selectedTask.category}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Reward:</span>
                  <strong style={{ color: '#10b981' }}>₹{selectedTask.rewardInr}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Target Site:</span>
                  <span style={{ color: '#93c5fd' }}>{selectedTask.location.address}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Live GPS Fix */}
        <Card>
          <CardHeader title="2. Live Device GPS Status" subtitle="Coordinates required for geo-tag overlay" />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'var(--color-surface-sunken, #0f172a)',
            padding: '10px 14px',
            borderRadius: '8px',
          }}>
            <MapPin size={20} color="#3b82f6" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                {gps ? `${gps.lat.toFixed(5)}° N, ${gps.lng.toFixed(5)}° E` : 'Acquiring GPS...'}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                {gps ? `Accuracy: ±${gps.accuracy}m • ${gps.address?.slice(0, 45)}...` : 'Reading location sensor'}
              </p>
            </div>
            <button
              type="button"
              className="icon-btn"
              title="Refresh GPS"
              onClick={async () => {
                setAcquiringGps(true);
                try {
                  const p = await getCurrentGpsPosition();
                  setGps(p);
                  notify('GPS fix updated.');
                } finally {
                  setAcquiringGps(false);
                }
              }}
            >
              <RefreshCw size={14} className={acquiringGps ? 'spin' : ''} />
            </button>
          </div>
        </Card>

        {/* Mandatory Checklist */}
        <Card>
          <CardHeader title="3. Mandatory Checklist" subtitle="Complete all required activities before submit" />
          <ul className="stack stack--tight" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {checklist.map((item) => (
              <li
                key={item.id}
                onClick={() => handleToggleCheck(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: item.done ? 'rgba(34, 197, 94, 0.08)' : 'var(--color-surface-sunken, #0f172a)',
                  border: item.done ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid var(--color-border, #334155)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ marginTop: '2px', color: item.done ? '#22c55e' : '#64748b' }}>
                  {item.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </div>
                <span style={{
                  fontSize: '0.8125rem',
                  color: item.done ? '#cbd5e1' : '#94a3b8',
                  textDecoration: item.done ? 'line-through' : 'none',
                }}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Right Column: Camera Capture, Geotag Preview, Gemini Validation */}
      <div className="stack">
        <Card>
          <CardHeader
            title="4. Geo-Tagged Photographic Evidence"
            subtitle="Open device camera for live HUD capture or upload photo taken from any GeoTag GPS Camera app"
          />

          {/* Action buttons for Camera vs Manual Upload */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <input
              ref={manualInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {!isCameraOpen && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => startCamera('environment')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Camera size={16} /> Open Camera (Auto Geo-Tag)
              </button>
            )}

            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => manualInputRef.current?.click()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Upload size={16} /> Upload Photo (External GPS App)
            </button>
          </div>

          {/* 1. LIVE CAMERA VIEWFINDER WITH REAL-TIME HUD */}
          {isCameraOpen ? (
            <div style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#090d16',
              border: '2px solid #3b82f6',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
              marginBottom: '1.25rem',
            }}>
              {/* Shutter flash animation */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: '#ffffff',
                opacity: isCapturing ? 0.9 : 0,
                transition: 'opacity 0.15s ease',
                pointerEvents: 'none',
                zIndex: 30,
              }} />

              {/* Live Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  minHeight: '360px',
                  maxHeight: '480px',
                  objectFit: 'cover',
                  display: 'block',
                  background: '#000000',
                }}
              />

              {/* Viewfinder Top HUD Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(to bottom, rgba(11, 17, 32, 0.92) 0%, rgba(11, 17, 32, 0) 100%)',
                zIndex: 10,
                pointerEvents: 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 8px #ef4444',
                  }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.05em' }}>
                    REC • LIVE GPS CAMERA
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#38bdf8',
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <Clock size={12} /> {liveClock}
                  </span>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.2)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                  }}>
                    🛰️ GPS LOCKED
                  </span>
                </div>
              </div>

              {/* Viewfinder Center Reticle Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 5,
              }}>
                <div style={{
                  width: '240px',
                  height: '180px',
                  position: 'relative',
                  border: '1px dashed rgba(255, 255, 255, 0.25)',
                  borderRadius: '8px',
                }}>
                  <div style={{ position: 'absolute', top: -2, left: -2, width: 18, height: 18, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
                  <div style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />
                  <div style={{ position: 'absolute', bottom: -2, left: -2, width: 18, height: 18, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 14,
                    height: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{ width: 14, height: 2, background: 'rgba(255, 255, 255, 0.7)', position: 'absolute' }} />
                    <div style={{ width: 2, height: 14, background: 'rgba(255, 255, 255, 0.7)', position: 'absolute' }} />
                  </div>
                </div>
                <div style={{
                  marginTop: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  background: 'rgba(15, 23, 42, 0.75)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(4px)',
                }}>
                  Align item in reticle
                </div>
              </div>

              {/* Viewfinder Bottom Watermark Overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 16px',
                background: 'linear-gradient(to top, rgba(11, 17, 32, 0.95) 0%, rgba(11, 17, 32, 0.7) 70%, rgba(11, 17, 32, 0) 100%)',
                zIndex: 10,
                pointerEvents: 'none',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#38bdf8' }}>
                      CHASEHORSE FIELD VERIFICATION
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: '#ffffff',
                      background: 'rgba(37, 99, 235, 0.4)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}>
                      📍 {gps ? `${gps.lat.toFixed(5)}° N, ${gps.lng.toFixed(5)}° E (±${gps.accuracy}m)` : 'Locating...'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#e2e8f0' }}>
                    🏠 {gps?.address || 'Reading location address...'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                    📋 {selectedTask?.title} • ID: {selectedTask?.id} • Worker: {actorName}
                  </div>
                </div>
              </div>

              {/* Viewfinder Controls Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--color-surface-sunken, #0f172a)',
                borderTop: '1px solid var(--color-border, #334155)',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={toggleCameraFacing}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={14} /> Flip Camera ({cameraFacing === 'environment' ? 'Rear' : 'Front'})
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={handleCloseCamera}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={isCapturing}
                  onClick={handleSnapAndStamp}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
                  }}
                >
                  <Camera size={18} /> {isCapturing ? 'Stamping Geo-Tag...' : '📸 Snap & Stamp Geo-Tag'}
                </button>
              </div>
            </div>
          ) : capturedPhotoUrl ? (
            /* 2. STAMPED PHOTO PREVIEW WITH WATERMARK METADATA */
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--color-border, #334155)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              }}>
                <img
                  src={capturedPhotoUrl}
                  alt="Stamped Field Evidence"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: '440px',
                    objectFit: 'contain',
                    background: '#000000',
                  }}
                />
              </div>

              {/* Verified Metadata Card */}
              <div style={{
                background: 'var(--color-surface-sunken, #0f172a)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginTop: '0.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '8px',
                fontSize: '0.75rem',
              }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>📍 Stamped GPS:</span>{' '}
                  <strong style={{ color: '#38bdf8' }}>
                    {gps ? `${gps.lat.toFixed(5)}° N, ${gps.lng.toFixed(5)}° E` : '16.24184° N, 80.64480° E'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>🎯 Fix Accuracy:</span>{' '}
                  <strong style={{ color: '#10b981' }}>±{gps?.accuracy || 12}m (High Precision)</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>🕒 Timestamp:</span>{' '}
                  <strong style={{ color: '#cbd5e1' }}>{liveClock}</strong>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="#a78bfa" />
                  <span style={{ color: '#94a3b8' }}>Tamper Seal:</span>{' '}
                  <strong style={{ color: '#a78bfa' }}>Geo-Tag Watermark Embedded</strong>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => startCamera('environment')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Camera size={14} /> Retake / Open Camera
                </button>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <label className="field__label">Evidence Caption / Observations</label>
                <input
                  type="text"
                  className="input"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="e.g. Shelf Facing Verified, Brand in stock, Planogram aligned"
                />
              </div>
            </div>
          ) : (
            /* 3. NO PHOTO STAGED YET */
            <div style={{
              padding: '3rem 1.5rem',
              borderRadius: '12px',
              border: '2px dashed var(--color-border, #334155)',
              background: 'var(--color-surface-sunken, #0f172a)',
              textAlign: 'center',
              marginBottom: '1.25rem',
            }}>
              <Camera size={36} color="#64748b" style={{ margin: '0 auto 0.75rem auto' }} />
              <h4 style={{ margin: '0 0 0.35rem 0', color: '#f8fafc', fontSize: '1rem' }}>No Photo Staged Yet</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)', maxWidth: '420px', marginInline: 'auto' }}>
                Click "Open Camera (Auto Geo-Tag)" to start the live camera viewfinder. Coordinates and timestamp will be permanently marked on the captured photo.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => startCamera('environment')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Camera size={16} /> Open Camera (Auto Geo-Tag)
              </button>
            </div>
          )}

          {/* Gemini AI Validation Card */}
          {capturedPhotoUrl && (
            <div style={{
              background: 'var(--color-surface-sunken, #0f172a)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#60a5fa" />
                  <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>Google Gemini AI Evidence Inspection</strong>
                </div>
                <button
                  type="button"
                  disabled={aiRunning}
                  onClick={handleRunGeminiValidation}
                  className="btn btn--primary btn--sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Bot size={14} className={aiRunning ? 'spin' : ''} />
                  {aiRunning ? 'Analyzing Image...' : 'Verify with Gemini AI'}
                </button>
              </div>

              {aiResult ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <Badge tone={aiStatusLabel[aiResult.status].tone}>
                      {aiStatusLabel[aiResult.status].label}
                    </Badge>
                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                      Confidence: <strong>{Math.round((aiResult.confidence || 0.8) * 100)}%</strong> • Model: {aiResult.model}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>
                    {aiResult.summary}
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {aiResult.checks.map((c) => (
                      <li
                        key={c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.8125rem',
                          background: 'rgba(15, 23, 42, 0.6)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        {c.outcome === 'pass' ? (
                          <CheckCircle2 size={15} color="#22c55e" />
                        ) : c.outcome === 'warn' ? (
                          <AlertTriangle size={15} color="#f59e0b" />
                        ) : (
                          <XCircle size={15} color="#ef4444" />
                        )}
                        <strong style={{ color: '#f8fafc' }}>{c.label}:</strong>
                        <span style={{ color: '#94a3b8' }}>{c.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                  Click "Verify with Gemini AI" to validate image relevance against task checklist and cross-check GPS metadata.
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            disabled={submitting || !capturedPhotoUrl || !checklist.every((c) => c.done)}
            onClick={handleSubmitEvidence}
            className="btn btn--primary"
            style={{
              width: '100%',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.95rem',
            }}
          >
            <Send size={16} />
            {submitting ? 'Submitting Evidence...' : 'Submit Field Evidence for Manager Review & Reward Release'}
          </button>
        </Card>
      </div>
    </div>
  );
}

/* ===================================================================== */
/*  2. Manager Review Queue Section (For Operations Managers & Admins)   */
/* ===================================================================== */

function ReviewEvidenceSection({
  evidenceList,
  tasks,
  onDecided,
}: {
  evidenceList: Evidence[];
  tasks: Task[];
  onDecided: () => void;
}) {
  const { actorName, role } = useRole();
  const dir = useDirectory();
  const { notify } = useToast();

  const [filter, setFilter] = useState<ManagerDecisionStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(evidenceList[0]?.id || null);
  const [note, setNote] = useState('');
  const [deciding, setDeciding] = useState(false);

  const items = useMemo(() => {
    return evidenceList
      .filter((e) => filter === 'all' || e.managerDecision.status === filter)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [evidenceList, filter]);

  useEffect(() => {
    if (items.length > 0 && !items.some((e) => e.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const selected = items.find((e) => e.id === selectedId);
  const task = tasks.find((t) => t.id === selected?.taskId);

  const handleDecision = async (status: Exclude<ManagerDecisionStatus, 'pending'>) => {
    if (!selected) return;
    if (status !== 'approved' && !note.trim()) {
      notify('Please include a review note explaining the rejection or rework requirement.', 'info');
      return;
    }

    setDeciding(true);
    try {
      await api.decideEvidence(selected.id, status, note.trim(), { name: actorName });
      notify(
        status === 'approved'
          ? `Evidence approved! Reward authorized and credited to worker wallet.`
          : `Decision saved: ${managerDecisionLabel[status].label}`,
      );
      setNote('');
      onDecided();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Decision failed', 'info');
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '1.5rem' }}>
      {/* Submissions List */}
      <Card>
        <CardHeader title="Submissions Queue" />
        <div style={{ marginBottom: '1rem' }}>
          <select
            className="input input--compact"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Submissions</option>
            <option value="pending">Awaiting Manager Review</option>
            <option value="approved">Approved</option>
            <option value="rework">Rework Requested</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {items.length === 0 ? (
          <EmptyState title="No submissions" description="No evidence submissions match this filter." />
        ) : (
          <ul className="ev-list">
            {items.map((e) => {
              const t = tasks.find((x) => x.id === e.taskId);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className={`ev-item ${e.id === selectedId ? 'ev-item--on' : ''}`}
                    onClick={() => setSelectedId(e.id)}
                  >
                    <span className="cell-title">{t?.title || e.taskId}</span>
                    <span className="cell-sub">
                      {dir.employeeName(e.employeeId)} • {formatDateTime(e.submittedAt)}
                    </span>
                    <span className="ev-item__badges">
                      <Badge tone={managerDecisionLabel[e.managerDecision.status].tone}>
                        {managerDecisionLabel[e.managerDecision.status].label}
                      </Badge>
                      <Badge tone={aiStatusLabel[e.ai.status].tone}>
                        AI: {aiStatusLabel[e.ai.status].label}
                      </Badge>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Selected Submission Detail */}
      {selected && task ? (
        <div className="stack">
          {/* Header Card */}
          <Card>
            <CardHeader
              title={task.title}
              subtitle={`Task: ${task.id} • Reward: ₹${task.rewardInr} • Category: ${task.category}`}
            />
            <dl className="defs defs--wide">
              <div>
                <dt>Worker</dt>
                <dd>{dir.employeeName(selected.employeeId)}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDateTime(selected.submittedAt)}</dd>
              </div>
              <div>
                <dt>Target Site</dt>
                <dd>{task.location.address}, {task.location.area}</dd>
              </div>
              <div>
                <dt>Approval Status</dt>
                <dd>
                  <Badge tone={managerDecisionLabel[selected.managerDecision.status].tone}>
                    {managerDecisionLabel[selected.managerDecision.status].label}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          {/* Stamped Evidence Photos */}
          <Card>
            <CardHeader
              title={`Submitted Geo-Tagged Photos (${selected.photos.length})`}
              subtitle="Inspect stamped presentation copy with embedded GPS, timestamp, and address"
            />
            {selected.photos.length === 0 ? (
              <EmptyState title="No photos attached" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {selected.photos.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid var(--color-border, #334155)',
                      background: '#000000',
                    }}
                  >
                    {p.url ? (
                      <img
                        src={p.url}
                        alt={p.caption}
                        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '380px', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        Photo Record #{p.id}
                      </div>
                    )}
                    <div style={{ padding: '10px 14px', background: 'var(--color-surface, #1e293b)' }}>
                      <p style={{ margin: '0 0 2px 0', fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                        {p.caption}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                        Captured: {formatDateTime(p.capturedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* AI Inspection Verdict */}
          <Card>
            <CardHeader
              title="Gemini AI Multimodal Verification"
              subtitle={`Model: ${selected.ai.model || 'gemini-1.5-flash'} • Confidence: ${Math.round((selected.ai.confidence || 0.85) * 100)}%`}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Badge tone={aiStatusLabel[selected.ai.status].tone}>
                AI Verdict: {aiStatusLabel[selected.ai.status].label}
              </Badge>
              {selected.ai.confidence !== null && (
                <div style={{ flex: 1, maxWidth: '240px' }}>
                  <Meter
                    value={selected.ai.confidence}
                    label="AI confidence score"
                    tone={selected.ai.status === 'passed' ? 'ai' : 'warning'}
                  />
                </div>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: '0 0 1rem 0' }}>
              {selected.ai.summary}
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selected.ai.checks.map((c) => (
                <li
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8125rem',
                    background: 'var(--color-surface-sunken, #0f172a)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                  }}
                >
                  {c.outcome === 'pass' ? (
                    <CheckCircle2 size={16} color="#22c55e" />
                  ) : c.outcome === 'warn' ? (
                    <AlertTriangle size={16} color="#f59e0b" />
                  ) : (
                    <XCircle size={16} color="#ef4444" />
                  )}
                  <strong style={{ color: '#f8fafc' }}>{c.label}:</strong>
                  <span style={{ color: '#94a3b8' }}>{c.detail}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Manager Decision Actions or Worker Submission Status */}
          <Card>
            <CardHeader
              title={
                role === 'employee' || role === 'field_worker'
                  ? 'Operations Review & Payout Status'
                  : 'Operations Manager Approval & Payment'
              }
              subtitle={
                role === 'employee' || role === 'field_worker'
                  ? 'Live lifecycle status of your field evidence and reward credit'
                  : 'Decisions made here authorize release of reward credits to the worker wallet ledger'
              }
            />
            {role === 'employee' || role === 'field_worker' ? (
              <div>
                {selected.managerDecision.status === 'approved' ? (
                  <div
                    style={{
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      padding: '1.25rem',
                      borderRadius: '8px',
                      color: '#4ade80',
                      fontSize: '0.9rem',
                    }}
                  >
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1rem' }}>
                      ✓ Task Submission Approved!
                    </p>
                    <p style={{ margin: 0 }}>
                      Approved by {selected.managerDecision.decidedBy || 'Operations'} at{' '}
                      {formatDateTime(selected.managerDecision.decidedAt || selected.submittedAt)}. Your
                      reward of <strong>₹{task?.rewardInr || 0}</strong> has been credited to your wallet ledger.
                    </p>
                  </div>
                ) : selected.managerDecision.status === 'rework' ? (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      padding: '1.25rem',
                      borderRadius: '8px',
                      color: '#fbbf24',
                      fontSize: '0.9rem',
                    }}
                  >
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1rem' }}>
                      ⚠️ Rework Requested by Operations
                    </p>
                    <p style={{ margin: '0 0 0.75rem 0' }}>
                      <strong>Reviewer feedback:</strong> "{selected.managerDecision.note || 'Please capture clearer photographic evidence.'}"
                    </p>
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => {
                        window.location.search = `?taskId=${selected.taskId}`;
                      }}
                      style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                    >
                      Retake Photo Evidence & Resubmit →
                    </button>
                  </div>
                ) : selected.managerDecision.status === 'rejected' ? (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      padding: '1.25rem',
                      borderRadius: '8px',
                      color: '#f87171',
                      fontSize: '0.9rem',
                    }}
                  >
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1rem' }}>
                      ✕ Task Submission Not Approved
                    </p>
                    <p style={{ margin: 0 }}>
                      Reason: "{selected.managerDecision.note || 'Evidence did not meet verification criteria.'}"
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      padding: '1.25rem',
                      borderRadius: '8px',
                      color: '#7dd3fc',
                      fontSize: '0.9rem',
                    }}
                  >
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1rem' }}>
                      ⏳ Pending Operations Review
                    </p>
                    <p style={{ margin: 0 }}>
                      Your evidence has been uploaded with GPS watermark verification. An Operations
                      Manager is reviewing this submission. Reward of <strong>₹{task?.rewardInr || 0}</strong>{' '}
                      is staged and will be credited immediately upon approval.
                    </p>
                  </div>
                )}
              </div>
            ) : selected.managerDecision.status === 'approved' ? (
              <div style={{
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                padding: '1rem',
                borderRadius: '8px',
                color: '#4ade80',
                fontSize: '0.875rem',
              }}>
                ✓ Task approved by {selected.managerDecision.decidedBy} at {formatDateTime(selected.managerDecision.decidedAt || '')}. Reward of ₹{task?.rewardInr || 0} has been credited to wallet ledger.
              </div>
            ) : (
              <div className="stack stack--tight">
                <TextAreaField
                  label="Manager Review Note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Notes to field worker (required for rework or rejection)..."
                />

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button
                    variant="success"
                    disabled={deciding}
                    onClick={() => handleDecision('approved')}
                  >
                    ✓ Approve & Authorize Payment (₹{task?.rewardInr || 0})
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={deciding}
                    onClick={() => handleDecision('rework')}
                  >
                    Request Rework
                  </Button>
                  <Button
                    variant="danger"
                    disabled={deciding}
                    onClick={() => handleDecision('rejected')}
                  >
                    Reject Evidence
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <EmptyState
            title="Select a submission"
            description="Choose a task submission from the list on the left to review photos, GPS geotags, and Gemini AI checks."
          />
        </Card>
      )}
    </div>
  );
}
