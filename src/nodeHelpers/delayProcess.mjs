/*
 *
 * Helper: `delayProcess`.
 *
 */

const delayProcess = (ms) =>
  new Promise((resolve) => setTimeout(() => resolve(), ms));

export default delayProcess;
