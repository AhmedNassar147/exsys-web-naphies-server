/*
 *
 * Helper: `replaceUnwantedCharactersFromString`.
 *
 */
const replaceUnwantedCharactersFromString = (valueString) => {
  if (!valueString) {
    return valueString;
  }

  return valueString.replace(/[^\x20-\x7E]/g, "");
};

export default replaceUnwantedCharactersFromString;
