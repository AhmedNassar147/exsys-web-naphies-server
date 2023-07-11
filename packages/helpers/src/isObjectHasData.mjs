/*
 *
 * Helper: `isObjectHasData`.
 *
 */
const isObjectHasData = (obj) =>
  Boolean(obj) &&
  typeof obj === "object" &&
  !Array.isArray(obj) &&
  !!Object.keys(obj).length;

export default isObjectHasData;
