/*
 *
 * Helper: `toCamelCase`.
 *
 */
const toCamelCase = (str) =>
  str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());

export default toCamelCase;
