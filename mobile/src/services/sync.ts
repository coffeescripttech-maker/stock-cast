// Sync Service - Sync data when online

import { cacheService, CACHE_KEYS, CACHE_EXPIRY } from './cache';
import { alertsService } from './alerts';
import { centersService } from './centers';
import { contactsService } from './contacts';
import { offlineQueue, QueuedAction } from './offlineQueue';
import { incidentsService } from './incidents';

class SyncService {
  private isSyncing = false;

  /**
   * Sync all data
   */
  async syncAll(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    this.isSyncing = true;
    console.log('Starting full sync...');

    try {
      await Promise.all([
        this.syncAlerts(),
        this.syncCenters(),
        this.syncContacts(),
      ]);

      // Process offline queue
      await this.uploadPending();

      console.log('Full sync completed');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync alerts
   */
  async syncAlerts(): Promise<void> {
    try {
      console.log('Syncing alerts...');
      const { alerts } = await alertsService.getAlerts({ isActive: true });
      
      if (alerts && alerts.length > 0) {
        await cacheService.set(CACHE_KEYS.ALERTS, alerts, CACHE_EXPIRY.ALERTS);
        console.log(`Cached ${alerts.length} alerts`);
      }
    } catch (error) {
      console.error('Error syncing alerts:', error);
    }
  }

  /**
   * Sync evacuation centers
   */
  async syncCenters(): Promise<void> {
    try {
      console.log('Syncing centers...');
      const { centers } = await centersService.getCenters();
      
      if (centers && centers.length > 0) {
        await cacheService.set(CACHE_KEYS.CENTERS, centers, CACHE_EXPIRY.CENTERS);
        console.log(`Cached ${centers.length} centers`);
      }
    } catch (error) {
      console.error('Error syncing centers:', error);
    }
  }

  /**
   * Sync emergency contacts
   */
  async syncContacts(): Promise<void> {
    try {
      console.log('Syncing contacts...');
      const { contacts } = await contactsService.getContacts();
      
      if (contacts && contacts.length > 0) {
        await cacheService.set(CACHE_KEYS.CONTACTS, contacts, CACHE_EXPIRY.CONTACTS);
        console.log(`Cached ${contacts.length} contacts`);
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
    }
  }

  /**
   * Upload pending queued actions
   */
  async uploadPending(): Promise<{ success: number; failed: number }> {
    console.log('Processing offline queue...');
    
    const result = await offlineQueue.processQueue(async (action: QueuedAction) => {
      try {
        switch (action.type) {
          case 'incident':
            await this.uploadIncident(action.data);
            return true;
          
          case 'sos':
            // SOS upload logic would go here
            console.log('SOS upload not yet implemented');
            return false;
          
          case 'location':
            // Location share upload logic would go here
            console.log('Location upload not yet implemented');
            return false;
          
          default:
            console.warn(`Unknown action type: ${action.type}`);
            return false;
        }
      } catch (error) {
        console.error(`Error uploading ${action.type}:`, error);
        return false;
      }
    });

    console.log(`Queue processed: ${result.success} success, ${result.failed} failed`);
    return result;
  }

  /**
   * Upload incident report
   */
  private async uploadIncident(data: any): Promise<void> {
    await incidentsService.createIncident(data);
  }

  /**
   * Get last sync time
   */
  async getLastSync(key: string): Promise<number | null> {
    return await cacheService.getTimestamp(key);
  }

  /**
   * Check if sync is needed
   */
  async needsSync(key: string): Promise<boolean> {
    const cached = await cacheService.get(key);
    return cached === null;
  }
}

export const syncService = new SyncService();
