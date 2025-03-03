import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";

export default {
  input: "src/ha-bambulab-cards.ts",
  output: [
    {
      file: "dist/ha-bambulab-cards.js",
      format: "iife",
      sourcemap: false,
    },
  ],
  plugins: [
    resolve({
      extensions: [".js", ".ts", ".tsx"],
    }),
    commonjs(),
    json(),
    postcss({
      inject: false,
      extract: true,
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      sourceMap: false,
      inlineSources: true,
      jsx: "react",
      declaration: false,
      declarationMap: false,
    }),
    terser(),
  ],
  preserveEntrySignatures: "strict",
};
