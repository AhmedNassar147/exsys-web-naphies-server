/*
 *
 * Helper: `extractValueFromUrl`.
 *
 */
const extractValueFromUrl = (url, replacedSection) =>
  url.replace(`${replacedSection}/`, "");

export default extractValueFromUrl;
