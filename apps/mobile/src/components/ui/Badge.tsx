import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../../theme';
import type { TaskStatus, TaskPriority } from '../../types';

interface BadgeProps {
  label: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'ai' | 'neutral';
  status?: TaskStatus;
  priority?: TaskPriority;
}

export const Badge: React.FC<BadgeProps> = ({ label, tone, status, priority }) => {
  let bg = 'rgba(56, 189, 248, 0.15)';
  let border = 'rgba(56, 189, 248, 0.3)';
  let text = colors.blueAccent;

  if (status) {
    switch (status) {
      case 'open':
        bg = 'rgba(56, 189, 248, 0.15)';
        border = 'rgba(56, 189, 248, 0.3)';
        text = '#38BDF8';
        break;
      case 'assigned':
      case 'in_progress':
        bg = 'rgba(29, 78, 216, 0.2)';
        border = 'rgba(59, 130, 246, 0.4)';
        text = '#60A5FA';
        break;
      case 'submitted':
      case 'in_review':
        bg = 'rgba(245, 158, 11, 0.15)';
        border = 'rgba(245, 158, 11, 0.3)';
        text = '#FBBF24';
        break;
      case 'approved':
        bg = 'rgba(16, 185, 129, 0.15)';
        border = 'rgba(16, 185, 129, 0.3)';
        text = '#34D399';
        break;
      case 'rejected':
        bg = 'rgba(239, 68, 68, 0.15)';
        border = 'rgba(239, 68, 68, 0.3)';
        text = '#F87171';
        break;
      default:
        bg = 'rgba(148, 163, 184, 0.15)';
        border = 'rgba(148, 163, 184, 0.3)';
        text = '#94A3B8';
    }
  } else if (priority) {
    switch (priority) {
      case 'urgent':
        bg = 'rgba(239, 68, 68, 0.15)';
        border = 'rgba(239, 68, 68, 0.3)';
        text = '#F87171';
        break;
      case 'high':
        bg = 'rgba(245, 158, 11, 0.15)';
        border = 'rgba(245, 158, 11, 0.3)';
        text = '#FBBF24';
        break;
      case 'normal':
        bg = 'rgba(59, 130, 246, 0.15)';
        border = 'rgba(59, 130, 246, 0.3)';
        text = '#60A5FA';
        break;
      case 'low':
        bg = 'rgba(148, 163, 184, 0.15)';
        border = 'rgba(148, 163, 184, 0.3)';
        text = '#94A3B8';
        break;
    }
  } else if (tone) {
    switch (tone) {
      case 'success':
        bg = 'rgba(16, 185, 129, 0.15)';
        border = 'rgba(16, 185, 129, 0.3)';
        text = '#34D399';
        break;
      case 'danger':
        bg = 'rgba(239, 68, 68, 0.15)';
        border = 'rgba(239, 68, 68, 0.3)';
        text = '#F87171';
        break;
      case 'warning':
        bg = 'rgba(245, 158, 11, 0.15)';
        border = 'rgba(245, 158, 11, 0.3)';
        text = '#FBBF24';
        break;
      case 'ai':
        bg = 'rgba(139, 92, 246, 0.15)';
        border = 'rgba(139, 92, 246, 0.3)';
        text = '#A78BFA';
        break;
      default:
        bg = 'rgba(56, 189, 248, 0.15)';
        border = 'rgba(56, 189, 248, 0.3)';
        text = '#38BDF8';
    }
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
