// Alert Card Component

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DisasterAlert } from '../../types/models';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { formatDate, formatTimeAgo } from '../../utils/formatting';

interface AlertCardProps {
  alert: DisasterAlert;
  onPress: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress }) => {
  const getSeverityColor = () => {
    if (!alert?.severity) return COLORS.textSecondary;
    switch (alert.severity) {
      case 'critical': return COLORS.error;
      case 'high': return COLORS.warning;
      case 'moderate': return COLORS.secondary;
      case 'low': return COLORS.info;
      default: return COLORS.textSecondary;
    }
  };

  const getAlertIcon = () => {
    if (!alert?.alertType) return '⚠️';
    switch (alert.alertType) {
      case 'typhoon': return '🌀';
      case 'earthquake': return '🌍';
      case 'flood': return '🌊';
      case 'storm_surge': return '🌊';
      case 'volcanic': return '🌋';
      case 'tsunami': return '🌊';
      case 'landslide': return '⛰️';
      default: return '⚠️';
    }
  };

  const getSourceBadge = (source: string | null | undefined) => {
    const sourceMap: Record<string, { label: string; color: string; icon: string }> = {
      // Automated sources
      'auto_weather': { label: 'Auto Weather', color: '#3B82F6', icon: '🌦️' },
      'auto_earthquake': { label: 'Auto Earthquake', color: '#F97316', icon: '🌍' },
      // Official agencies
      'PAGASA': { label: 'PAGASA', color: '#8B5CF6', icon: '🌡️' },
      'PHIVOLCS': { label: 'PHIVOLCS', color: '#F97316', icon: '🌋' },
      'NDRRMC': { label: 'NDRRMC', color: '#EF4444', icon: '🚨' },
      'LGU': { label: 'LGU', color: '#10B981', icon: '🏛️' },
      // Other sources
      'OTHER': { label: 'Other', color: '#6B7280', icon: '📋' },
    };

    // Handle empty, null, undefined, or 'N/A' sources
    if (!source || source === 'N/A' || source.trim() === '') {
      return (
        <View style={[styles.sourceBadge, { backgroundColor: '#F3F4F6' }]}>
          <Text style={styles.sourceBadgeIcon}>📝</Text>
          <Text style={[styles.sourceBadgeText, { color: '#374151' }]}>Manual</Text>
        </View>
      );
    }

    // Get source info from map or use default
    const sourceInfo = sourceMap[source] || { label: source, color: '#6B7280', icon: '📝' };

    return (
      <View style={[styles.sourceBadge, { backgroundColor: `${sourceInfo.color}15` }]}>
        <Text style={styles.sourceBadgeIcon}>{sourceInfo.icon}</Text>
        <Text style={[styles.sourceBadgeText, { color: sourceInfo.color }]}>{sourceInfo.label}</Text>
      </View>
    );
  };

  // Safety check
  if (!alert) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.severityBar, { backgroundColor: getSeverityColor() }]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{getAlertIcon()}</Text>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>{alert.title || 'Untitled Alert'}</Text>
            <Text style={styles.type}>{alert.alertType?.toUpperCase() || 'ALERT'}</Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() }]}>
            <Text style={styles.severityText}>{alert.severity?.toUpperCase() || 'UNKNOWN'}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {alert.description || 'No description available'}
        </Text>

        <View style={styles.footer}>
          <View style={styles.sourceContainer}>
            {getSourceBadge(alert.source)}
          </View>
          <Text style={styles.time}>{alert.createdAt ? formatTimeAgo(alert.createdAt) : 'Unknown time'}</Text>
        </View>

        {alert.advanceNoticeHours && alert.advanceNoticeHours > 0 && (
          <View style={styles.advanceNoticeBadge}>
            <Text style={styles.advanceNoticeIcon}>⏰</Text>
            <Text style={styles.advanceNoticeText}>
              {alert.advanceNoticeHours}h advance notice
            </Text>
          </View>
        )}

        {alert.affectedAreas && alert.affectedAreas.length > 0 && (
          <View style={styles.areas}>
            <Text style={styles.areasLabel}>Affected: </Text>
            <Text style={styles.areasText} numberOfLines={1}>
              {alert.affectedAreas.join(', ')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.borderRadius,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  severityBar: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  type: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  severityText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  sourceContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sourceBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  sourceBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  time: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  areas: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  areasLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  areasText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text,
  },
  advanceNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
  },
  advanceNoticeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  advanceNoticeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#FF9500',
  },
});
