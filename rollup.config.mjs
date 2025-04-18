import { getBabelInputPlugin, getBabelOutputPlugin } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import serve from "rollup-plugin-serve";
import image from "rollup-plugin-img";
import alias from "@rollup/plugin-alias";
import path from "path";

const dev = process.env.ROLLUP_WATCH;
const ignoreErrors = dev || process.env.IGNORE_TS_ERRORS === "true";

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
  alias({
    entries: [{ find: "~", replacement: path.resolve(__dirname, "src") }],
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
    },
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
