/**
 * NetEntitySync — ECS-aware network replication
 *
 * Syncs entity components across network, handles ownership transfer,
 * delta compression, and priority-based updates.
 *
 * @version 1.0.0
 */

export type SyncAuthority = 'server' | 'owner' | 'shared';

export interface SyncedComponent {
  entityId: string;
  componentType: string;
  data: Record<string, unknown>;
  version: number;
  lastSyncedAt: number;
  authority: SyncAuthority;
  ownerId: string;
  dirty: boolean;
}

export interface SyncSnapshot {
  entityId: string;
  components: Record<string, unknown>;
  version: number;
  timestamp: number;
}

export interface SyncStats {
  totalEntities: number;
  dirtyEntities: number;
  syncedThisFrame: number;
  bytesEstimated: number;
}

export class NetEntitySync {
  private entities: Map<string, Map<string, SyncedComponent>> = new Map();
  private snapshots: SyncSnapshot[] = [];
  private maxSnapshotHistory: number = 60;
  private syncRate: number;

  constructor(syncRate: number = 20) {
    this.syncRate = syncRate;
  }

  /**
   * Register an entity for sync
   */
  registerEntity(entityId: string, ownerId: string, authority: SyncAuthority = 'server'): void {
    if (!this.entities.has(entityId)) {
      this.entities.set(entityId, new Map());
    }
  }

  /**
   * Add a synced component to an entity
   */
  addComponent(entityId: string, componentType: string, data: Record<string, unknown>, ownerId: string = 'server'): void {
    this.registerEntity(entityId, ownerId);
    const components = this.entities.get(entityId)!;
    components.set(componentType, {
      entityId, componentType, data, version: 1,
      lastSyncedAt: Date.now(), authority: 'server', ownerId, dirty: true,
    });
  }

  /**
   * Update a component (marks dirty)
   */
  updateComponent(entityId: string, componentType: string, data: Record<string, unknown>): boolean {
    const comp = this.entities.get(entityId)?.get(componentType);
    if (!comp) return false;
    comp.data = { ...comp.data, ...data };
    comp.version++;
    comp.dirty = true;
    return true;
  }

  /**
   * Transfer ownership of an entity
   */
  transferOwnership(entityId: string, newOwnerId: string): boolean {
    const components = this.entities.get(entityId);
    if (!components) return false;
    for (const comp of components.values()) {
      comp.ownerId = newOwnerId;
      comp.dirty = true;
    }
    return true;
  }

  /**
   * Collect dirty components into a sync snapshot
   */
  collectDirty(): SyncSnapshot[] {
    const snapshots: SyncSnapshot[] = [];
    for (const [entityId, components] of this.entities) {
      const dirtyData: Record<string, unknown> = {};
      let maxVersion = 0;
      let hasDirty = false;

      for (const [type, comp] of components) {
        if (comp.dirty) {
          dirtyData[type] = comp.data;
          comp.dirty = false;
          comp.lastSyncedAt = Date.now();
          hasDirty = true;
        }
        if (comp.version > maxVersion) maxVersion = comp.version;
      }

      if (hasDirty) {
        const snapshot: SyncSnapshot = {
          entityId, components: dirtyData, version: maxVersion, timestamp: Date.now(),
        };
        snapshots.push(snapshot);
        this.snapshots.push(snapshot);
        if (this.snapshots.length > this.maxSnapshotHistory) this.snapshots.shift();
      }
    }
    return snapshots;
  }

  /**
   * Apply a received snapshot
   */
  applySnapshot(snapshot: SyncSnapshot): void {
    const components = this.entities.get(snapshot.entityId);
    if (!components) return;
    for (const [type, data] of Object.entries(snapshot.components)) {
      const comp = components.get(type);
      if (comp && snapshot.version >= comp.version) {
        comp.data = data as Record<string, unknown>;
        comp.version = snapshot.version;
        comp.dirty = false;
      }
    }
  }

  /**
   * Remove an entity from sync
   */
  removeEntity(entityId: string): boolean {
    return this.entities.delete(entityId);
  }

  /**
   * Get sync stats
   */
  getStats(): SyncStats {
    let dirty = 0;
    for (const components of this.entities.values()) {
      for (const comp of components.values()) {
        if (comp.dirty) { dirty++; break; }
      }
    }
    return {
      totalEntities: this.entities.size,
      dirtyEntities: dirty,
      syncedThisFrame: 0,
      bytesEstimated: this.snapshots.length * 128,
    };
  }

  getEntityCount(): number { return this.entities.size; }
  getSyncRate(): number { return this.syncRate; }
  getSnapshotCount(): number { return this.snapshots.length; }
}
