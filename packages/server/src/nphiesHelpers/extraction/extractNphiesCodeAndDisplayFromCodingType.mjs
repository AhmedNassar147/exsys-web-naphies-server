/*
 *
 * Helper: `extractNphiesCodeAndDisplayFromCodingType`.
 *
 */
const extractNphiesCodeAndDisplayFromCodingType = (type) => {
  if (!type) {
    return {};
  }
  const { coding, text, extension: typeExtension } = type;
  const [{ code, display, extension }] = coding || [{}];
  const [{ valueString }] = extension || [{}];
  const [{ valueString: typeExtensionValue }] = typeExtension || [{}];

  return {
    code,
    display,
    extensionValue: valueString || typeExtensionValue,
    text,
  };
};

export default extractNphiesCodeAndDisplayFromCodingType;
