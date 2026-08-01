// Reservation Modal Component
// Modal for creating evacuation center reservations

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import reservationService, { CreateReservationData } from '../../services/reservation';

interface ReservationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  centerId: number;
  centerName: string;
  availableSlots: number;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  visible,
  onClose,
  onSuccess,
  centerId,
  centerName,
  availableSlots,
}) => {
  const [groupSize, setGroupSize] = useState('1');
  const [estimatedArrival, setEstimatedArrival] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const showDateTimePicker = () => {
    if (Platform.OS === 'android') {
      // Use Android-specific API
      DateTimePickerAndroid.open({
        value: estimatedArrival,
        mode: 'date',
        minimumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            // After date is selected, show time picker
            DateTimePickerAndroid.open({
              value: selectedDate,
              mode: 'time',
              onChange: (timeEvent, selectedTime) => {
                if (timeEvent.type === 'set' && selectedTime) {
                  setEstimatedArrival(selectedTime);
                }
              },
            });
          }
        },
      });
    } else {
      // iOS uses modal picker
      setShowDatePicker(true);
    }
  };

  const handleSubmit = async () => {
    // Validation
    const size = parseInt(groupSize);
    if (isNaN(size) || size <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid group size');
      return;
    }

    if (size > 50) {
      Alert.alert('Invalid Input', 'Maximum group size is 50 people');
      return;
    }

    if (size > availableSlots) {
      Alert.alert(
        'Not Enough Slots',
        `Only ${availableSlots} slots available. Please reduce group size.`
      );
      return;
    }

    if (estimatedArrival < new Date()) {
      Alert.alert('Invalid Date', 'Estimated arrival must be in the future');
      return;
    }

    try {
      setLoading(true);

      const data: CreateReservationData = {
        groupSize: size,
        estimatedArrival: estimatedArrival.toISOString(),
        notes: notes.trim() || undefined,
      };

      await reservationService.createReservation(centerId, data);

      Alert.alert(
        'Reservation Created',
        `Your reservation for ${size} ${size === 1 ? 'person' : 'people'} has been created. You have 30 minutes to arrive.`,
        [{ text: 'OK', onPress: () => {
          onSuccess();
          handleClose();
        }}]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupSize('1');
    setEstimatedArrival(new Date());
    setNotes('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Reserve Slot</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Center Info */}
            <View style={styles.centerInfo}>
              <Text style={styles.centerName}>{centerName}</Text>
              <Text style={styles.availableSlots}>
                {availableSlots} slots available
              </Text>
            </View>

            {/* Warning */}
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠</Text>
              <Text style={styles.warningText}>
                Reservation expires in 30 minutes. Please arrive before expiration.
              </Text>
            </View>

            {/* Group Size */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Group Size *</Text>
              <TextInput
                style={styles.input}
                value={groupSize}
                onChangeText={setGroupSize}
                keyboardType="number-pad"
                placeholder="Enter number of people (1-50)"
                maxLength={2}
              />
              <Text style={styles.hint}>Maximum 50 people per reservation</Text>
            </View>

            {/* Estimated Arrival */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Arrival *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={showDateTimePicker}
              >
                <Text style={styles.dateButtonText}>
                  {estimatedArrival.toLocaleString()}
                </Text>
              </TouchableOpacity>
              {/* iOS only - show modal picker */}
              {Platform.OS === 'ios' && showDatePicker && (
                <DateTimePicker
                  value={estimatedArrival}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setEstimatedArrival(selectedDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special requirements or notes..."
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Reserve Slot</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  centerInfo: {
    marginBottom: 16,
  },
  centerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  availableSlots: {
    fontSize: 14,
    color: '#10B981',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1F2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ReservationModal;
