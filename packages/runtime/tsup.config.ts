import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    events: 'src/events.ts',
    storage: 'src/storage.ts',
    device: 'src/device.ts',
    timing: 'src/timing.ts',
    math: 'src/math.ts',
    navigation: 'src/navigation.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['react', '@react-three/fiber', 'three'],
});
