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
    "fs/promises",
    "nodemon",
    "child_process",
    "https",
    "crypto",
    "axios",
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
        beautify: false,
        comments: false,
        indent_level: 2,
        shebang: true,
        shorthand: true,
      },
    }),
  ],
};
