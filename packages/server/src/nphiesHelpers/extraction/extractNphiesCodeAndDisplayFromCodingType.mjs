/*
 *
 * Helper: `extractNphiesCodeAndDisplayFromCodingType`.
 *
 */
const extractNphiesCodeAndDisplayFromCodingType = (type) => {
  if (!type) {
    return {};
  }
  const { coding } = type;
  const [{ code, display }] = coding || [{}];

  return {
    code,
    display,
  };
};

export default extractNphiesCodeAndDisplayFromCodingType;
