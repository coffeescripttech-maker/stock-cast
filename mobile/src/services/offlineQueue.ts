// Offline Queue Service - Queue actions for when back online

import { storeData, getData } from '../utils/storage';

export interface QueuedAction {
  id: string;
  type: 'incident' | 'sos' | 'location' | 'alert';
  data: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'processing' | 'failed';
}

const QUEUE_KEY = 'offline_queue';
const MAX_RETRIES = 3;

class OfflineQueueService {
  /**
   * Add action to queue
   */
  async addToQueue(type: QueuedAction['type'], data: any): Promise<string> {
    try {
      const queue = await this.getQueue();
      
      const action: QueuedAction = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      };

      queue.push(action);
      await storeData(QUEUE_KEY, queue);
      
      console.log(`Added ${type} to offline queue:`, action.id);
      return action.id;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  /**
   * Get all queued actions
   */
  async getQueue(): Promise<QueuedAction[]> {
    try {
      const queue = await getData<QueuedAction[]>(QUEUE_KEY);
      return queue || [];
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  }

  /**
   * Get pending actions
   */
  async getPendingActions(): Promise<QueuedAction[]> {
    const queue = await this.getQueue();
    return queue.filter(action => action.status === 'pending');
  }

  /**
   * Update action status
   */
  async updateActionStatus(
    id: string,
    status: QueuedAction['status'],
    incrementRetry: boolean = false
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex(action => action.id === id);
      
      if (index !== -1) {
        queue[index].status = status;
        if (incrementRetry) {
          queue[index].retries += 1;
        }
        await storeData(QUEUE_KEY, queue);
      }
    } catch (error) {
      console.error('Error updating action status:', error);
    }
  }

  /**
   * Remove action from queue
   */
  async removeAction(id: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter(action => action.id !== id);
      await storeData(QUEUE_KEY, filtered);
      console.log(`Removed action from queue: ${id}`);
    } catch (error) {
      console.error('Error removing action:', error);
    }
  }

  /**
   * Process queue (call when back online)
   */
  async processQueue(
    processor: (action: QueuedAction) => Promise<boolean>
  ): Promise<{ success: number; failed: number }> {
    const pending = await this.getPendingActions();
    let success = 0;
    let failed = 0;

    for (const action of pending) {
      // Skip if max retries reached
      if (action.retries >= MAX_RETRIES) {
        await this.updateActionStatus(action.id, 'failed');
        failed++;
        continue;
      }

      try {
        await this.updateActionStatus(action.id, 'processing');
        const result = await processor(action);
        
        if (result) {
          await this.removeAction(action.id);
          success++;
        } else {
          await this.updateActionStatus(action.id, 'pending', true);
          failed++;
        }
      } catch (error) {
        console.error(`Error processing action ${action.id}:`, error);
        await this.updateActionStatus(action.id, 'pending', true);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    failed: number;
  }> {
    const queue = await this.getQueue();
    
    return {
      total: queue.length,
      pending: queue.filter(a => a.status === 'pending').length,
      processing: queue.filter(a => a.status === 'processing').length,
      failed: queue.filter(a => a.status === 'failed').length,
    };
  }

  /**
   * Clear all failed actions
   */
  async clearFailed(): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter(action => action.status !== 'failed');
      await storeData(QUEUE_KEY, filtered);
    } catch (error) {
      console.error('Error clearing failed actions:', error);
    }
  }

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    try {
      await storeData(QUEUE_KEY, []);
      console.log('Queue cleared');
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }
}

export const offlineQueue = new OfflineQueueService();
