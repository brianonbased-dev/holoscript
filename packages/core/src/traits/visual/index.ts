/**
 * Trait Visual System — barrel export and auto-registration.
 *
 * Importing this module registers all preset visual configs into
 * the TraitVisualRegistry singleton, making them available to the
 * R3FCompiler and future compilers.
 */

export { TraitVisualRegistry } from './TraitVisualRegistry';
export type { TraitVisualConfig, R3FMaterialProps, VisualLayer } from './types';
export { VISUAL_LAYER_PRIORITY } from './types';

// Preset data re-exports (original 12)
export { MATERIAL_PROPERTIES_VISUALS } from './presets/material-properties.visual';
export { SURFACE_TEXTURE_VISUALS } from './presets/surface-texture.visual';
export { LIGHTING_VISUALS } from './presets/lighting.visual';
export { GEMS_MINERALS_VISUALS } from './presets/gems-minerals.visual';
export { FABRIC_CLOTH_VISUALS } from './presets/fabric-cloth.visual';
export { VISUAL_EFFECTS_VISUALS } from './presets/visual-effects.visual';
export { AGE_CONDITION_VISUALS } from './presets/age-condition.visual';
export { WATER_FLUID_VISUALS } from './presets/water-fluid.visual';
export { WEATHER_PHENOMENA_VISUALS } from './presets/weather-phenomena.visual';
export { EMOTION_MOOD_VISUALS } from './presets/emotion-mood.visual';
export { SIZE_SCALE_VISUALS } from './presets/size-scale.visual';
export { ENVIRONMENTAL_BIOME_VISUALS } from './presets/environmental-biome.visual';

// Preset data re-exports (expansion)
export { MAGIC_FANTASY_VISUALS } from './presets/magic-fantasy.visual';
export { SCIFI_TECHNOLOGY_VISUALS } from './presets/scifi-technology.visual';
export { CREATURES_MYTHICAL_VISUALS } from './presets/creatures-mythical.visual';
export { NATURE_LIFE_VISUALS } from './presets/nature-life.visual';
export { FURNITURE_DECOR_VISUALS } from './presets/furniture-decor.visual';
export { CONSTRUCTION_BUILDING_VISUALS } from './presets/construction-building.visual';
export { CONTAINERS_STORAGE_VISUALS } from './presets/containers-storage.visual';
export { SHAPE_FORM_VISUALS } from './presets/shape-form.visual';
export { ANIMALS_VISUALS } from './presets/animals.visual';
export { MARITIME_NAVAL_VISUALS } from './presets/maritime-naval.visual';
export { TIME_PERIOD_VISUALS } from './presets/time-period.visual';

import { TraitVisualRegistry } from './TraitVisualRegistry';
import { MATERIAL_PROPERTIES_VISUALS } from './presets/material-properties.visual';
import { SURFACE_TEXTURE_VISUALS } from './presets/surface-texture.visual';
import { LIGHTING_VISUALS } from './presets/lighting.visual';
import { GEMS_MINERALS_VISUALS } from './presets/gems-minerals.visual';
import { FABRIC_CLOTH_VISUALS } from './presets/fabric-cloth.visual';
import { VISUAL_EFFECTS_VISUALS } from './presets/visual-effects.visual';
import { AGE_CONDITION_VISUALS } from './presets/age-condition.visual';
import { WATER_FLUID_VISUALS } from './presets/water-fluid.visual';
import { WEATHER_PHENOMENA_VISUALS } from './presets/weather-phenomena.visual';
import { EMOTION_MOOD_VISUALS } from './presets/emotion-mood.visual';
import { SIZE_SCALE_VISUALS } from './presets/size-scale.visual';
import { ENVIRONMENTAL_BIOME_VISUALS } from './presets/environmental-biome.visual';
import { MAGIC_FANTASY_VISUALS } from './presets/magic-fantasy.visual';
import { SCIFI_TECHNOLOGY_VISUALS } from './presets/scifi-technology.visual';
import { CREATURES_MYTHICAL_VISUALS } from './presets/creatures-mythical.visual';
import { NATURE_LIFE_VISUALS } from './presets/nature-life.visual';
import { FURNITURE_DECOR_VISUALS } from './presets/furniture-decor.visual';
import { CONSTRUCTION_BUILDING_VISUALS } from './presets/construction-building.visual';
import { CONTAINERS_STORAGE_VISUALS } from './presets/containers-storage.visual';
import { SHAPE_FORM_VISUALS } from './presets/shape-form.visual';
import { ANIMALS_VISUALS } from './presets/animals.visual';
import { MARITIME_NAVAL_VISUALS } from './presets/maritime-naval.visual';
import { TIME_PERIOD_VISUALS } from './presets/time-period.visual';

/** All preset visual data in registration order. */
const ALL_PRESETS = [
  // Original 12
  MATERIAL_PROPERTIES_VISUALS,
  SURFACE_TEXTURE_VISUALS,
  LIGHTING_VISUALS,
  GEMS_MINERALS_VISUALS,
  FABRIC_CLOTH_VISUALS,
  VISUAL_EFFECTS_VISUALS,
  AGE_CONDITION_VISUALS,
  WATER_FLUID_VISUALS,
  WEATHER_PHENOMENA_VISUALS,
  EMOTION_MOOD_VISUALS,
  SIZE_SCALE_VISUALS,
  ENVIRONMENTAL_BIOME_VISUALS,
  // Expansion
  MAGIC_FANTASY_VISUALS,
  SCIFI_TECHNOLOGY_VISUALS,
  CREATURES_MYTHICAL_VISUALS,
  NATURE_LIFE_VISUALS,
  FURNITURE_DECOR_VISUALS,
  CONSTRUCTION_BUILDING_VISUALS,
  CONTAINERS_STORAGE_VISUALS,
  SHAPE_FORM_VISUALS,
  ANIMALS_VISUALS,
  MARITIME_NAVAL_VISUALS,
  TIME_PERIOD_VISUALS,
];

/**
 * Register all preset visuals into the global registry.
 * Called once on module load. Exported for testing (re-registration after reset).
 */
export function registerAllPresets(): void {
  const registry = TraitVisualRegistry.getInstance();
  for (const presetMap of ALL_PRESETS) {
    registry.registerBatch(presetMap);
  }
}

// Auto-register on import
registerAllPresets();
