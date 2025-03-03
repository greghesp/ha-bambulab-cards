import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/ha-bambulab-cards.ts',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    resolve({
      extensions: ['.js', '.ts', '.tsx']
    }),
    commonjs(),
    json(),
    postcss({
      inject: false,
      extract: true
    }),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      inlineSources: true,
      jsx: 'react',
      declaration: false,
      declarationMap: false
    }),
    terser(),
  ],
  preserveEntrySignatures: 'strict',
}; 