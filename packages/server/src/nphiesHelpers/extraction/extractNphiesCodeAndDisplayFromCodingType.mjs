/*
 *
 * Helper: `extractNphiesCodeAndDisplayFromCodingType`.
 *
 */
const extractNphiesCodeAndDisplayFromCodingType = (type) => {
  if (!type) {
    return {};
  }
  const { coding, text } = type;
  const [{ code, display, extension }] = coding || [{}];
  const [{ valueString }] = extension || [{}];

  return {
    code,
    display,
    extensionValue: valueString,
    text,
  };
};

export default extractNphiesCodeAndDisplayFromCodingType;
