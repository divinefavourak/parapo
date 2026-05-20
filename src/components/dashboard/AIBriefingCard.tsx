import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { AIBriefing } from '../../features/dashboard/types';

interface Props {
  data: AIBriefing;
}

const tagVariants = {
  warning: { dot: Colors.accentRed, text: Colors.textSecondary },
  success: { dot: Colors.accentGreen, text: Colors.textSecondary },
  info: { dot: Colors.accentBlue, text: Colors.textSecondary },
};

export const AIBriefingCard: React.FC<Props> = ({ data }) => {
  return (
    <View style={styles.container}>
      {/* Purple ambient glow */}
      <View style={styles.glow} />

      <View style={styles.header}>
        <View style={styles.iconBg}>
          <Text style={styles.iconEmoji}>✦</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.sectionLabel}>AI DAILY BRIEFING</Text>
          <Text style={styles.summary}>{data.summary}</Text>
          <View style={styles.tags}>
            {data.tags.map((tag, i) => {
              const v = tagVariants[tag.type];
              return (
                <View key={i} style={styles.tag}>
                  <View style={[styles.tagDot, { backgroundColor: v.dot }]} />
                  <Text style={[styles.tagText, { color: v.text }]}>{tag.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(18,18,18,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    borderRadius: 8,
    padding: 17,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 12,
    backgroundColor: 'rgba(160,120,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    gap: 16,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#201f1f',
    borderWidth: 1,
    borderColor: 'rgba(160,120,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    color: Colors.accentPurple,
    fontSize: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  sectionLabel: {
    ...Typography.labelUppercase,
    color: Colors.accentPurple,
    letterSpacing: 0.65,
  },
  summary: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginTop: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 9,
    paddingVertical: 5,
    height: 24,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 12,
  },
  tagText: {
    ...Typography.labelMedium,
  },
});
