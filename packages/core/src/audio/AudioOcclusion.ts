/**
 * AudioOcclusion.ts
 *
 * Obstacle-based audio occlusion and obstruction.
 * Raycasts between listener and sources to determine
 * how much sound is blocked by walls/objects.
 *
 * @module audio
 */

// =============================================================================
// TYPES
// =============================================================================

export interface OcclusionMaterial {
  id: string;
  name: string;
  absorptionCoefficient: number;  // 0-1, how much sound is absorbed
  transmissionLoss: number;       // dB lost per material hit
}

export interface OcclusionResult {
  sourceId: string;
  occluded: boolean;
  occlusionFactor: number;        // 0-1 (0 = fully audible, 1 = fully blocked)
  hitCount: number;
  totalTransmissionLoss: number;  // dB
  materials: string[];            // Material IDs hit
}

export interface OcclusionRay {
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  maxDistance: number;
}

export interface OcclusionHit {
  distance: number;
  materialId: string;
  thickness: number;   // Meters
}

// =============================================================================
// MATERIAL PRESETS
// =============================================================================

export const OCCLUSION_MATERIALS: Record<string, OcclusionMaterial> = {
  glass: { id: 'glass', name: 'Glass', absorptionCoefficient: 0.1, transmissionLoss: 6 },
  wood: { id: 'wood', name: 'Wood', absorptionCoefficient: 0.3, transmissionLoss: 12 },
  drywall: { id: 'drywall', name: 'Drywall', absorptionCoefficient: 0.2, transmissionLoss: 10 },
  brick: { id: 'brick', name: 'Brick', absorptionCoefficient: 0.4, transmissionLoss: 20 },
  concrete: { id: 'concrete', name: 'Concrete', absorptionCoefficient: 0.5, transmissionLoss: 30 },
  metal: { id: 'metal', name: 'Metal', absorptionCoefficient: 0.05, transmissionLoss: 35 },
  fabric: { id: 'fabric', name: 'Fabric', absorptionCoefficient: 0.7, transmissionLoss: 3 },
  water: { id: 'water', name: 'Water', absorptionCoefficient: 0.02, transmissionLoss: 8 },
};

// =============================================================================
// AUDIO OCCLUSION SYSTEM
// =============================================================================

export type RaycastProvider = (ray: OcclusionRay) => OcclusionHit[];

export class AudioOcclusionSystem {
  private materials: Map<string, OcclusionMaterial> = new Map();
  private raycastProvider: RaycastProvider | null = null;
  private maxTransmissionLoss = 60;  // dB cap
  private cache: Map<string, OcclusionResult> = new Map();

  constructor() {
    // Register default materials
    for (const mat of Object.values(OCCLUSION_MATERIALS)) {
      this.materials.set(mat.id, mat);
    }
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  setRaycastProvider(provider: RaycastProvider): void {
    this.raycastProvider = provider;
  }

  registerMaterial(material: OcclusionMaterial): void {
    this.materials.set(material.id, material);
  }

  getMaterial(id: string): OcclusionMaterial | undefined {
    return this.materials.get(id);
  }

  setMaxTransmissionLoss(db: number): void {
    this.maxTransmissionLoss = Math.max(0, db);
  }

  // ---------------------------------------------------------------------------
  // Computation
  // ---------------------------------------------------------------------------

  /**
   * Compute occlusion between listener and a source.
   * Uses the registered raycast provider to detect obstacles.
   */
  computeOcclusion(
    listenPos: { x: number; y: number; z: number },
    sourcePos: { x: number; y: number; z: number },
    sourceId: string,
  ): OcclusionResult {
    if (!this.raycastProvider) {
      return { sourceId, occluded: false, occlusionFactor: 0, hitCount: 0, totalTransmissionLoss: 0, materials: [] };
    }

    const dx = sourcePos.x - listenPos.x;
    const dy = sourcePos.y - listenPos.y;
    const dz = sourcePos.z - listenPos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist === 0) {
      return { sourceId, occluded: false, occlusionFactor: 0, hitCount: 0, totalTransmissionLoss: 0, materials: [] };
    }

    const ray: OcclusionRay = {
      origin: { ...listenPos },
      direction: { x: dx / dist, y: dy / dist, z: dz / dist },
      maxDistance: dist,
    };

    const hits = this.raycastProvider(ray);
    if (hits.length === 0) {
      return { sourceId, occluded: false, occlusionFactor: 0, hitCount: 0, totalTransmissionLoss: 0, materials: [] };
    }

    let totalLoss = 0;
    const hitMaterials: string[] = [];

    for (const hit of hits) {
      const mat = this.materials.get(hit.materialId);
      if (mat) {
        totalLoss += mat.transmissionLoss;
        hitMaterials.push(hit.materialId);
      }
    }

    totalLoss = Math.min(totalLoss, this.maxTransmissionLoss);
    const factor = totalLoss / this.maxTransmissionLoss;

    const result: OcclusionResult = {
      sourceId,
      occluded: totalLoss > 0,
      occlusionFactor: factor,
      hitCount: hits.length,
      totalTransmissionLoss: totalLoss,
      materials: hitMaterials,
    };

    this.cache.set(sourceId, result);
    return result;
  }

  /**
   * Compute without raycasting — direct manual hit specification.
   * Useful for testing or pre-computed occlusion.
   */
  computeFromHits(sourceId: string, hits: OcclusionHit[]): OcclusionResult {
    let totalLoss = 0;
    const hitMaterials: string[] = [];

    for (const hit of hits) {
      const mat = this.materials.get(hit.materialId);
      if (mat) {
        totalLoss += mat.transmissionLoss;
        hitMaterials.push(hit.materialId);
      }
    }

    totalLoss = Math.min(totalLoss, this.maxTransmissionLoss);
    const factor = totalLoss / this.maxTransmissionLoss;

    return {
      sourceId,
      occluded: totalLoss > 0,
      occlusionFactor: factor,
      hitCount: hits.length,
      totalTransmissionLoss: totalLoss,
      materials: hitMaterials,
    };
  }

  /**
   * Get the volume multiplier for a given occlusion factor.
   * Converts transmission loss to a linear volume reduction.
   */
  getVolumeMultiplier(occlusionFactor: number): number {
    // Convert dB loss back to linear multiplier
    const dbLoss = occlusionFactor * this.maxTransmissionLoss;
    return Math.pow(10, -dbLoss / 20);
  }

  getCachedResult(sourceId: string): OcclusionResult | undefined {
    return this.cache.get(sourceId);
  }

  clearCache(): void {
    this.cache.clear();
  }
}
