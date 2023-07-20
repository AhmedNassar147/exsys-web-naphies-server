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
  const [{ code, display, extension }] = coding || [{}];
  const [{ valueString }] = extension || [{}];

  return {
    code,
    display,
    extensionValue: valueString,
  };
};

export default extractNphiesCodeAndDisplayFromCodingType;
