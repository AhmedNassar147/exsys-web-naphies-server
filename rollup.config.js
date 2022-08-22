/*
 *
 * Rollup config
 *
 */
import shebang from "rollup-plugin-shebang-bin";
import { terser } from "rollup-plugin-terser";

export default {
  external: [
    "fs",
    "cors",
    "express",
    "body-parser",
    "node-fetch",
    "fs/promises",
  ],
  input: "src/index.js",
  output: {
    dir: "bin",
    format: "esm",
  },
  plugins: [
    shebang(),
    terser({
      format: {
        beautify: true,
        comments: false,
        indent_level: 2,
        shebang: true,
        shorthand: true,
      },
    }),
  ],
};
