import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, Wallet as WalletIcon } from 'lucide-react';
import { api } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useDirectory } from '@/hooks/useDirectory';
import { PageHeader, Card, CardHeader, StatCard } from '@/components/ui/Card';
import { Async, EmptyState, Notice, Skeleton } from '@/components/ui/States';
import { Badge, DemoTag } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatDateTime, formatInr, formatSignedInr } from '@/utils/format';
import { transactionStatusLabel, transactionTypeLabel } from '@/utils/labels';
import type { TransactionStatus, TransactionType } from '@/types';

export function WalletPage() {
  const accounts = useAsync(() => api.listWalletAccounts(), []);
  const dir = useDirectory();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = accounts.data;
  const activeId = selectedId ?? list?.[0]?.employeeId ?? null;
  const account = list?.find((a) => a.employeeId === activeId);

  const totals = useMemo(
    () => ({
      balance: (list ?? []).reduce((s, a) => s + a.balanceInr, 0),
      pending: (list ?? []).reduce((s, a) => s + a.pendingInr, 0),
    }),
    [list],
  );

  return (
    <>
      <PageHeader title="Employee wallets" description="Balances and transaction history per employee." actions={<DemoTag label="Demo ledger" />} />

      <Notice tone="warning" title="Demo ledger — not connected to any payment system">
        Every balance and transaction below is invented sample data. This prototype has no top-up, payout or withdrawal actions and moves no money.
      </Notice>

      <div className="grid grid--stats grid--stats-3">
        <StatCard icon={WalletIcon} tone="brand" label="Sample balances (all)" value={formatInr(totals.balance)} hint="Sum of completed sample entries" />
        <StatCard icon={Clock} tone="warning" label="Sample pending" value={formatInr(totals.pending)} hint="Entries marked pending" />
        <StatCard icon={ArrowDownLeft} tone="success" label="Wallets" value={list?.length ?? '…'} hint="Approved or suspended staff" />
      </div>

      <div className="grid grid--wallet">
        <Card aria-labelledby="wal-list">
          <CardHeader id="wal-list" title="Employees" />
          <Async state={accounts} skeletonLines={5}>
            {(rows) => (
              <ul className="wal-list">
                {rows.map((a) => {
                  const name = dir.employeeName(a.employeeId);
                  return (
                    <li key={a.employeeId}>
                      <button type="button" className={`wal-item ${a.employeeId === activeId ? 'wal-item--on' : ''}`} aria-pressed={a.employeeId === activeId} onClick={() => setSelectedId(a.employeeId)}>
                        <Avatar name={name} size={32} />
                        <span className="wal-item__main">
                          <span className="cell-title">{name}</span>
                          <span className="cell-sub">{a.pendingInr > 0 ? `${formatInr(a.pendingInr)} pending` : 'Nothing pending'}</span>
                        </span>
                        <strong>{formatInr(a.balanceInr)}</strong>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Async>
        </Card>

        <Card aria-labelledby="wal-detail">
          {account && activeId ? (
            <WalletDetail key={activeId} employeeId={activeId} name={dir.employeeName(activeId)} balance={account.balanceInr} pending={account.pendingInr} />
          ) : (
            <>
              <CardHeader id="wal-detail" title="Transactions" />
              {accounts.loading ? <Skeleton lines={5} /> : <EmptyState title="Select an employee" />}
            </>
          )}
        </Card>
      </div>
    </>
  );
}

function WalletDetail({ employeeId, name, balance, pending }: { employeeId: string; name: string; balance: number; pending: number }) {
  const state = useAsync(() => api.listTransactions(employeeId), [employeeId]);
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [status, setStatus] = useState<TransactionStatus | 'all'>('all');

  return (
    <>
      <CardHeader id="wal-detail" title={name} subtitle="Sample balance and history" />
      <div className="balance">
        <div>
          <p className="stat-card__label">Sample balance</p>
          <p className="balance__value">{formatInr(balance)}</p>
        </div>
        <div>
          <p className="stat-card__label">Pending</p>
          <p className="balance__value balance__value--sub">{formatInr(pending)}</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="field-inline">
          <label htmlFor="tx-type" className="field__label">Type</label>
          <select id="tx-type" className="input input--compact" value={type} onChange={(e) => setType(e.target.value as TransactionType | 'all')}>
            <option value="all">All types</option>
            {(Object.keys(transactionTypeLabel) as TransactionType[]).map((t) => <option key={t} value={t}>{transactionTypeLabel[t]}</option>)}
          </select>
        </div>
        <div className="field-inline">
          <label htmlFor="tx-status" className="field__label">Status</label>
          <select id="tx-status" className="input input--compact" value={status} onChange={(e) => setStatus(e.target.value as TransactionStatus | 'all')}>
            <option value="all">All statuses</option>
            {(Object.keys(transactionStatusLabel) as TransactionStatus[]).map((s) => <option key={s} value={s}>{transactionStatusLabel[s].label}</option>)}
          </select>
        </div>
      </div>

      <Async state={state} skeletonLines={5}>
        {(all) => {
          const rows = all.filter((t) => (type === 'all' || t.type === type) && (status === 'all' || t.status === status));
          return rows.length === 0 ? (
            <EmptyState title="No transactions" description="Nothing matches these filters." />
          ) : (
            <div className="table-wrap" role="region" aria-label={`Transactions for ${name}`} tabIndex={0}>
              <table className="table table--stack">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Type</th>
                    <th scope="col">Reference</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id}>
                      <td data-label="Date">{formatDateTime(t.createdAt)}</td>
                      <td data-label="Type">
                        <span className="tx-type">
                          {t.amountInr >= 0 ? <ArrowDownLeft size={14} aria-hidden className="ico-ok" /> : <ArrowUpRight size={14} aria-hidden className="ico-muted" />}
                          {transactionTypeLabel[t.type]}
                        </span>
                      </td>
                      <td data-label="Reference"><span className="mono">{t.reference}</span>{t.taskId && <span className="cell-sub">{t.taskId}</span>}</td>
                      <td data-label="Status"><Badge tone={transactionStatusLabel[t.status].tone}>{transactionStatusLabel[t.status].label}</Badge></td>
                      <td data-label="Amount" className={`num ${t.amountInr < 0 ? 'neg' : ''} ${t.status === 'failed' ? 'struck' : ''}`}>{formatSignedInr(t.amountInr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }}
      </Async>
    </>
  );
}
