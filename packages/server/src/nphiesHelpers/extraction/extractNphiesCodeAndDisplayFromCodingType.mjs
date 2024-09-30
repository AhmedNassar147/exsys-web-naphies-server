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
  const [{ code, display, extension, system }] = coding || [{}];
  const [{ valueString }] = extension || [{}];
  const [{ valueString: typeExtensionValue }] = typeExtension || [{}];

  return {
    code,
    display,
    extensionValue: valueString || typeExtensionValue,
    text,
    codingSystemUrl: system,
  };
};

export default extractNphiesCodeAndDisplayFromCodingType;
