import { getBabelInputPlugin, getBabelOutputPlugin } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import serve from "rollup-plugin-serve";
import image from "rollup-plugin-img";
import postcss from 'rollup-plugin-postcss';

const dev = process.env.ROLLUP_WATCH;
const ignoreErrors = dev || process.env.IGNORE_TS_ERRORS === 'true';

const serveOptions = {
  contentBase: ["./dist"],
  host: "0.0.0.0",
  port: 4000,
  allowCrossOrigin: true,
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

const plugins = [
  image({
    output: `dist/images`,
    limit: 10000000,
  }),
  typescript({
    declaration: false,
    noEmitOnError: !ignoreErrors,
    tsconfig: './tsconfig.json',
    sourceMap: true,
  }),
  nodeResolve(),
  json(),
  commonjs(),
  getBabelInputPlugin({
    babelHelpers: "bundled",
  }),
  getBabelOutputPlugin({
    presets: [
      [
        "@babel/preset-env",
        {
          modules: false,
        },
      ],
    ],
    compact: true,
  }),
  postcss({
    extensions: ['.css'],
    inject: true,
    extract: false,
    modules: false,
    minimize: true
  }),
  ...(dev ? [serve(serveOptions)] : [terser()]),
];

export default [
  {
    input: "src/ha-bambulab-cards.ts",
    output: {
      dir: "dist",
      format: "es",
      inlineDynamicImports: true,
      sourcemap: true
    },
    external: ['react', 'react-dom'],
    plugins,
    moduleContext: (id) => {
      const thisAsWindowForModules = [
        "node_modules/@formatjs/intl-utils/lib/src/diff.js",
        "node_modules/@formatjs/intl-utils/lib/src/resolve-locale.js",
      ];
      if (thisAsWindowForModules.some((id_) => id.trimRight().endsWith(id_))) {
        return "window";
      }
    },
  },
];
