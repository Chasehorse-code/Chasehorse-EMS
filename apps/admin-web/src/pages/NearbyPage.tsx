import { useMemo, useState } from 'react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Async, EmptyState, Notice } from '@/components/ui/States';
import { Badge, DemoTag } from '@/components/ui/Badge';
import { SelectField } from '@/components/ui/Fields';
import { formatDate } from '@/utils/format';
import { haversineKm } from '@/utils/geo';
import { priorityLabel, taskStatusLabel } from '@/utils/labels';
import type { Employee, Task, TaskStatus } from '@/types';

const ACTIVE: TaskStatus[] = ['open', 'assigned', 'in_progress', 'submitted', 'in_review'];
const SIZE = 360;
const C = SIZE / 2;
const R = SIZE / 2 - 24;

export function NearbyPage() {
  const state = useAsync(async () => {
    const [tasks, employees] = await Promise.all([api.listTasks(), api.listEmployees()]);
    return { tasks, employees };
  }, []);

  const [centerId, setCenterId] = useState('e1');
  const [radius, setRadius] = useState(8);
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        title="Nearby task monitoring"
        description="See open and active tasks around a field employee. Pick a person and a radius."
        actions={<DemoTag />}
      />
      <Async state={state} skeletonLines={6}>
        {({ tasks, employees }) => {
          const centre: Employee | undefined = employees.find((e) => e.id === centerId) ?? employees[0];
          return (
            <NearbyBody
              tasks={tasks}
              employees={employees}
              centre={centre}
              centerId={centerId}
              setCenterId={(id) => { setCenterId(id); setSelected(null); }}
              radius={radius}
              setRadius={setRadius}
              onlyUnassigned={onlyUnassigned}
              setOnlyUnassigned={setOnlyUnassigned}
              selected={selected}
              setSelected={setSelected}
            />
          );
        }}
      </Async>
    </>
  );
}

interface BodyProps {
  tasks: Task[];
  employees: Employee[];
  centre: Employee | undefined;
  centerId: string;
  setCenterId: (id: string) => void;
  radius: number;
  setRadius: (n: number) => void;
  onlyUnassigned: boolean;
  setOnlyUnassigned: (b: boolean) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
}

function NearbyBody({ tasks, employees, centre, centerId, setCenterId, radius, setRadius, onlyUnassigned, setOnlyUnassigned, selected, setSelected }: BodyProps) {
  const approved = employees.filter((e) => e.approvalStatus === 'approved');

  const nearby = useMemo(() => {
    if (!centre) return [];
    return tasks
      .filter((t) => ACTIVE.includes(t.status) && (!onlyUnassigned || !t.assigneeId))
      .map((t) => ({ t, km: haversineKm(centre.location, t.location) }))
      .filter((x) => x.km <= radius)
      .sort((a, b) => a.km - b.km);
  }, [tasks, centre, radius, onlyUnassigned]);

  const peers = useMemo(() => {
    if (!centre) return [];
    return approved
      .filter((e) => e.id !== centre.id && e.availability !== 'offline')
      .map((e) => ({ e, km: haversineKm(centre.location, e.location) }))
      .filter((x) => x.km <= radius);
  }, [approved, centre, radius]);

  if (!centre) return <EmptyState title="No approved employees" />;

  const project = (p: { lat: number; lng: number }) => {
    const kmEast = (p.lng - centre.location.lng) * 111.32 * Math.cos((centre.location.lat * Math.PI) / 180);
    const kmNorth = (p.lat - centre.location.lat) * 110.57;
    return { x: C + (kmEast / radius) * R, y: C - (kmNorth / radius) * R };
  };

  const chosen = nearby.find((n) => n.t.id === selected);

  return (
    <div className="grid grid--nearby">
      <Card aria-labelledby="radar-title">
        <CardHeader id="radar-title" title="Schematic radar" subtitle="Not a live map — positions are sample coordinates" />
        <div className="controls">
          <SelectField label="Centre on employee" value={centerId} onChange={(e) => setCenterId(e.target.value)}>
            {approved.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.location.area}</option>)}
          </SelectField>
          <div className="field">
            <label htmlFor="radius" className="field__label">Radius: <strong>{radius} km</strong></label>
            <input id="radius" type="range" min={1} max={30} step={1} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="range" />
          </div>
          <label className="check">
            <input type="checkbox" checked={onlyUnassigned} onChange={(e) => setOnlyUnassigned(e.target.checked)} />
            <span>Only unassigned tasks</span>
          </label>
        </div>

        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="radar" role="img" aria-label={`Radar showing ${nearby.length} tasks and ${peers.length} other available employees within ${radius} kilometres of ${centre.name}. The list beside it has the same information.`}>
          {[1, 0.66, 0.33].map((f) => <circle key={f} cx={C} cy={C} r={R * f} className="radar__ring" />)}
          <line x1={C} x2={C} y1={C - R} y2={C + R} className="radar__axis" />
          <line x1={C - R} x2={C + R} y1={C} y2={C} className="radar__axis" />
          <text x={C} y={C - R - 6} textAnchor="middle" className="radar__label">N</text>
          <text x={C + R * 0.33} y={C + 12} className="radar__label">{(radius * 0.33).toFixed(1)} km</text>
          <text x={C + R * 0.66} y={C + 12} className="radar__label">{(radius * 0.66).toFixed(1)}</text>
          <text x={C + R - 4} y={C + 12} textAnchor="end" className="radar__label">{radius}</text>

          {peers.map(({ e }) => {
            const p = project(e.location);
            return <rect key={e.id} x={p.x - 4} y={p.y - 4} width="8" height="8" rx="2" className="radar__peer"><title>{e.name} (available employee)</title></rect>;
          })}

          {nearby.map(({ t }) => {
            const p = project(t.location);
            const on = t.id === selected;
            return (
              <g key={t.id} className={`radar__pin radar__pin--${taskStatusLabel[t.status].tone} ${on ? 'radar__pin--on' : ''}`} transform={`translate(${p.x} ${p.y})`}>
                <circle r={on ? 9 : 6.5} />
                <title>{t.id} — {t.title}</title>
              </g>
            );
          })}

          <g transform={`translate(${C} ${C})`}>
            <circle r="9" className="radar__centre" />
            <circle r="15" className="radar__pulse" />
          </g>
        </svg>

        <ul className="legend">
          <li><i className="dot dot--centre" aria-hidden /> {centre.name}</li>
          <li><i className="dot dot--info" aria-hidden /> Open / assigned</li>
          <li><i className="dot dot--warning" aria-hidden /> In progress / review</li>
          <li><i className="dot dot--peer" aria-hidden /> Other available employee ({peers.length})</li>
        </ul>
      </Card>

      <Card aria-labelledby="near-list">
        <CardHeader id="near-list" title={`${nearby.length} task${nearby.length === 1 ? '' : 's'} within ${radius} km`} subtitle="Closest first. Select a row to highlight it on the radar." />
        {nearby.length === 0 ? (
          <EmptyState title="Nothing in range" description="Increase the radius or turn off the unassigned filter." />
        ) : (
          <ul className="near-list">
            {nearby.map(({ t, km }) => (
              <li key={t.id}>
                <button type="button" className={`near-item ${t.id === selected ? 'near-item--on' : ''}`} aria-pressed={t.id === selected} onClick={() => setSelected(t.id === selected ? null : t.id)}>
                  <span className="near-item__main">
                    <span className="cell-title">{t.title}</span>
                    <span className="cell-sub">{t.id} · {t.location.area} · due {formatDate(t.dueAt)}</span>
                  </span>
                  <span className="near-item__side">
                    <strong>{km.toFixed(1)} km</strong>
                    <Badge tone={taskStatusLabel[t.status].tone}>{taskStatusLabel[t.status].label}</Badge>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {chosen && (
          <div className="detail-strip" aria-live="polite">
            <p><strong>{chosen.t.title}</strong></p>
            <p className="muted">{chosen.t.location.address}</p>
            <p>
              <Badge tone={priorityLabel[chosen.t.priority].tone}>{priorityLabel[chosen.t.priority].label} priority</Badge>{' '}
              {chosen.t.assigneeId ? `Assigned to ${employees.find((e) => e.id === chosen.t.assigneeId)?.name ?? 'someone'}` : 'Unassigned'}
            </p>
          </div>
        )}
        <Notice title="About locations">Employee positions are static sample coordinates. A real build would stream device locations through the API, with consent and retention rules defined.</Notice>
      </Card>
    </div>
  );
}
