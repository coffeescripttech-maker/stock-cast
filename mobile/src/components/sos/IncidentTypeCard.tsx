// Incident Type Card Component

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IncidentType } from '../../types/incidentTypes';

interface Props {
  incidentType: IncidentType;
  onPress: () => void;
}

export const IncidentTypeCard: React.FC<Props> = ({ incidentType, onPress }) => {
  const getPriorityColor = () => {
    switch (incidentType.priority) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPriorityBgColor = () => {
    switch (incidentType.priority) {
      case 'critical':
        return '#FEE2E2';
      case 'high':
        return '#FEF3C7';
      case 'medium':
        return '#DBEAFE';
      case 'low':
        return '#D1FAE5';
      default:
        return '#F3F4F6';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{incidentType.icon}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{incidentType.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {incidentType.description}
          </Text>
          {incidentType.responders && incidentType.responders.length > 0 && (
            <Text style={styles.responders}>
              Responders: {incidentType.responders.map(r => r.agency).join(', ')}
            </Text>
          )}
        </View>
      </View>
      <View
        style={[
          styles.priorityBadge,
          {
            backgroundColor: getPriorityBgColor(),
            borderColor: getPriorityColor(),
          },
        ]}
      >
        <Text style={[styles.priorityText, { color: getPriorityColor() }]}>
          {incidentType.priority.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  responders: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default IncidentTypeCard;
