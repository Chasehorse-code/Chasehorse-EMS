import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ChaseHorseLogo } from '@/components/ui/ChaseHorseLogo';
import { TaskAuditPreviewCard } from '@/components/landing/TaskAuditPreviewCard';

export interface AuthSplitLayoutProps {
  children: React.ReactNode;
  tagline: string;
  subTag: string; // e.g. "ONE TASK, ONE RECORD" or "FOR FIELD WORKERS"
  previewCardDecision?: string;
  previewCardStatus?: 'approved' | 'review';
}

export function AuthSplitLayout({
  children,
  tagline,
  subTag,
  previewCardDecision = '₹450 credited',
  previewCardStatus = 'approved',
}: AuthSplitLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        background: '#f5f3ee',
        color: '#111315',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* =========================================================================
          LEFT HALF: The Clean Warm Paper Form Panel
          ========================================================================= */}
      <div
        data-theme="light"
        style={{
          flex: '1 1 50%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2.5rem clamp(1.5rem, 4vw, 4rem)',
          boxSizing: 'border-box',
          position: 'relative',
          background: '#f5f3ee',
          color: '#111315',
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '2rem',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <ChaseHorseLogo theme="light" size="md" />
          </Link>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#4b5563',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#111315')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4b5563')}
          >
            <ArrowLeft size={14} />
            <span>Back to site</span>
          </Link>
        </div>

        {/* Centered Form Area */}
        <div
          style={{
            maxWidth: '440px',
            width: '100%',
            margin: '0 auto',
            padding: '1rem 0',
          }}
        >
          {children}
        </div>

        {/* Footer Note */}
        <div
          style={{
            marginTop: '2rem',
            textAlign: 'left',
            fontSize: '0.6875rem',
            color: '#9ca3af',
            lineHeight: 1.4,
          }}
        >
          Prototype - demo sign-in only. No real accounts, emails or security.
        </div>
      </div>

      {/* =========================================================================
          RIGHT HALF: The Deep Pitch Carbon Showcase Panel
          ========================================================================= */}
      <div
        className="auth-split-right"
        style={{
          flex: '1 1 50%',
          minHeight: '100vh',
          background: '#111315',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3rem clamp(2rem, 5vw, 5rem)',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid pattern background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            pointerEvents: 'none',
          }}
        />

        {/* Top: Futuristic ChaseHorse Branding with Logiworx Subtitle */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <ChaseHorseLogo theme="dark" size="lg" withSubtitle={true} />
        </div>

        {/* Center: The Floating Task Record Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '2.5rem 0',
          }}
        >
          <TaskAuditPreviewCard
            status={previewCardStatus}
            decisionLabel={previewCardDecision}
          />
        </div>

        {/* Bottom Tag & Punchy Headline */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '440px',
          }}
        >
          {/* Orange Tag with Small Square */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: '#eb5724',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#eb5724',
                borderRadius: '1px',
              }}
            />
            <span>{subTag}</span>
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(1.25rem, 2vw, 1.625rem)',
              fontWeight: 700,
              lineHeight: 1.35,
              color: '#ffffff',
              letterSpacing: '-0.015em',
            }}
          >
            {tagline}
          </h2>
        </div>
      </div>
    </div>
  );
}
