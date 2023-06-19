/*
 *
 * Helper: `extractNphiesCodeFromCodingType`.
 *
 */
const extractNphiesCodeFromCodingType = (type) => {
  const { coding } = type || {};
  const [{ code }] = coding || [{}];

  return code;
};

export default extractNphiesCodeFromCodingType;
