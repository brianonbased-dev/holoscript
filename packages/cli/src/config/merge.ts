/**
 * Deep merge utility for configuration objects
 */

export function mergeConfigs<T extends Record<string, any>>(base: T, extension: Partial<T>): T {
  const result = { ...base };

  for (const key in extension) {
    const baseValue = base[key];
    const extensionValue = extension[key];

    if (extensionValue === undefined) continue;

    if (
      isObject(baseValue) &&
      isObject(extensionValue) &&
      !Array.isArray(baseValue) &&
      !Array.isArray(extensionValue)
    ) {
      result[key] = mergeConfigs(baseValue, extensionValue) as any;
    } else {
      result[key] = extensionValue as any;
    }
  }

  return result;
}

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}
