// Reservation API Service
// Handles all evacuation center reservation API calls

import api, { handleApiError } from './api';
import { ApiResponse } from '../types/api';

export interface Reservation {
  id: number;
  centerId: number;
  userId: number;
  groupSize: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'arrived';
  estimatedArrival: string;
  reservedAt: string;
  expiresAt: string;
  confirmedAt?: string;
  confirmedBy?: number;
  cancelledAt?: string;
  cancellationReason?: string;
  arrivedAt?: string;
  notes?: string;
  // Extended fields from join
  centerName?: string;
  centerAddress?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}

export interface CenterStatus {
  centerId: number;
  available: boolean;
  availableSlots: number;
  statusLevel: 'available' | 'limited' | 'critical' | 'full';
  myReservation?: Reservation;
}

export interface AvailabilityCheck {
  available: boolean;
  availableSlots: number;
  statusLevel: string;
}

export interface CreateReservationData {
  groupSize: number;
  estimatedArrival: string; // ISO date string
  notes?: string;
}

class ReservationService {
  /**
   * Create a new reservation
   */
  async createReservation(
    centerId: number,
    data: CreateReservationData
  ): Promise<Reservation> {
    try {
      console.log('📝 Creating reservation:', { centerId, ...data });
      
      const response = await api.post<ApiResponse<Reservation>>(
        `/centers/${centerId}/reserve`,
        data
      );

      console.log('✅ Reservation created:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Create reservation error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user's reservations
   */
  async getMyReservations(): Promise<Reservation[]> {
    try {
      console.log('📋 Fetching my reservations...');
      
      const response = await api.get<ApiResponse<Reservation[]>>(
        '/centers/reservations/my'
      );

      console.log('✅ Reservations fetched:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      console.error('❌ Get reservations error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(
    reservationId: number,
    reason?: string
  ): Promise<void> {
    try {
      console.log('❌ Cancelling reservation:', reservationId);
      
      await api.post(`/centers/reservations/${reservationId}/cancel`, {
        reason: reason || 'User cancelled'
      });

      console.log('✅ Reservation cancelled');
    } catch (error) {
      console.error('❌ Cancel reservation error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get center status with availability
   */
  async getCenterStatus(centerId: number): Promise<CenterStatus> {
    try {
      console.log('📊 Fetching center status:', centerId);
      
      const response = await api.get<ApiResponse<CenterStatus>>(
        `/centers/${centerId}/status`
      );

      console.log('✅ Center status:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Get center status error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Check availability for specific group size
   */
  async checkAvailability(
    centerId: number,
    groupSize: number
  ): Promise<AvailabilityCheck> {
    try {
      console.log('🔍 Checking availability:', { centerId, groupSize });
      
      const response = await api.post<ApiResponse<AvailabilityCheck>>(
        `/centers/${centerId}/check-availability`,
        { groupSize }
      );

      console.log('✅ Availability check:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Check availability error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get time remaining for reservation (in milliseconds)
   */
  getTimeRemaining(expiresAt: string): number {
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, expiryTime - now);
  }

  /**
   * Format time remaining as string
   */
  formatTimeRemaining(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Check if reservation is expiring soon (< 5 minutes)
   */
  isExpiringSoon(expiresAt: string): boolean {
    const remaining = this.getTimeRemaining(expiresAt);
    return remaining > 0 && remaining < 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if reservation has expired
   */
  hasExpired(expiresAt: string): boolean {
    return this.getTimeRemaining(expiresAt) === 0;
  }
}

export const reservationService = new ReservationService();
export default reservationService;
