/*
 *
 * Helper: `isArrayHasData`.
 *
 */
const isArrayHasData = (maybeArrayOfData) =>
  !!(Array.isArray(maybeArrayOfData) && maybeArrayOfData.length);

export default isArrayHasData;
