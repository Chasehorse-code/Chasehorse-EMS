import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Badge } from '../ui/Badge';

interface CameraHUDProps {
  taskId: string;
  taskTitle: string;
  onEvidenceCaptured: (photoMeta: {
    lat: number;
    lng: number;
    timestamp: string;
    aiScore: string;
  }) => void;
  onClose: () => void;
}

export const CameraHUD: React.FC<CameraHUDProps> = ({
  taskId,
  taskTitle,
  onEvidenceCaptured,
  onClose,
}) => {
  const [captured, setCaptured] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const lat = 16.24184;
  const lng = 80.6448;
  const accuracy = 4;
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const handleCapture = () => {
    setCaptured(true);
    setAnalyzingAi(true);

    setTimeout(() => {
      setAnalyzingAi(false);
      setAiResult('PASSED (96.8% Confidence) • Geofence & Signboard verified');
    }, 1200);
  };

  const handleConfirmSubmit = () => {
    onEvidenceCaptured({
      lat,
      lng,
      timestamp,
      aiScore: aiResult || 'PASSED',
    });
    Alert.alert('Evidence Verified & Staged', 'Geo-tagged photograph and Gemini AI audit pass have been attached to the task checklist.');
    onClose();
  };

  return (
    <View style={styles.overlay}>
      {/* Top HUD Info */}
      <View style={styles.topHud}>
        <View style={styles.hudMetaRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>CAMERA HUD • GPS SYNC ACTIVE</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Viewfinder simulation */}
      <View style={styles.viewfinder}>
        {/* Corner Reticles */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Center Target Indicator */}
        <View style={styles.centerTarget}>
          <Text style={{ color: 'rgba(56, 189, 248, 0.4)', fontSize: 24 }}>+</Text>
        </View>

        {/* Watermark Overlay Stamp (Burned into picture) */}
        <View style={styles.watermarkContainer}>
          <View style={styles.watermarkHeader}>
            <Text style={styles.watermarkTitle}>CHASEHORSE SECURE PROOF • TAMPER-SEALED</Text>
            <Badge label="VERIFIED FIX" tone="ai" />
          </View>
          <Text style={styles.watermarkLine}>TASK: {taskId} • {taskTitle.slice(0, 32)}</Text>
          <Text style={styles.watermarkLine}>
            📍 GPS: {lat.toFixed(5)}° N, {lng.toFixed(5)}° E (±{accuracy}m)
          </Text>
          <Text style={styles.watermarkLine}>🕒 TIME: {timestamp}</Text>
          <Text style={styles.watermarkLine}>🏢 LOCATION: Market Road, Tenali Cluster</Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {!captured ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.hintText}>Align subject within reticles & capture</Text>
            <TouchableOpacity style={styles.shutterBtn} onPress={handleCapture}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.postCaptureBox}>
            {analyzingAi ? (
              <View style={styles.aiLoadingRow}>
                <ActivityIndicator color={colors.ai} size="small" />
                <Text style={styles.aiLoadingText}>Gemini AI analyzing signboard & geofence...</Text>
              </View>
            ) : (
              <View>
                <View style={styles.aiResultHeader}>
                  <Text style={styles.aiScoreText}>✓ {aiResult}</Text>
                </View>
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={styles.retakeBtn}
                    onPress={() => {
                      setCaptured(false);
                      setAiResult(null);
                    }}
                  >
                    <Text style={styles.retakeText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmSubmit}>
                    <Text style={styles.confirmText}>Attach to Checklist ✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#050c18',
    zIndex: 999,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  topHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  hudMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  liveText: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  viewfinder: {
    marginHorizontal: spacing.lg,
    height: 380,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: '#091528',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.blueAccent,
  },
  cornerTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3 },
  centerTarget: {
    position: 'absolute',
    top: '40%',
    left: '46%',
  },
  watermarkContainer: {
    backgroundColor: 'rgba(5, 12, 24, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.3)',
    padding: spacing.md,
  },
  watermarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  watermarkTitle: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  watermarkLine: {
    color: '#E2E8F0',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
  },
  bottomControls: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  hintText: {
    color: colors.textLightMuted,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.blueAccent,
  },
  postCaptureBox: {
    width: '100%',
    backgroundColor: colors.navyDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
  },
  aiLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  aiLoadingText: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
  },
  aiResultHeader: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  aiScoreText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  retakeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  retakeText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 13,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
