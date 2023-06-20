/*
 *
 * Helper: `collectProcessOptions`.
 *
 */
import collectProcessOptionsSync from "./collectProcessOptionsSync.mjs";

const collectProcessOptions = async () =>
  new Promise((resolve) => resolve(collectProcessOptionsSync()));

export default collectProcessOptions;
