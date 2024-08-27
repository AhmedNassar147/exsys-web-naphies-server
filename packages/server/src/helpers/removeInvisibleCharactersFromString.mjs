/*
 *
 * helper: `removeInvisibleCharactersFromString`.
 *
 */
const removeInvisibleCharactersFromString = (value) => {
  if (!value) {
    return "";
  }

  return value.replace(/\s{1,300}|[^\x00-\x7F]/g, " ");
};

export default removeInvisibleCharactersFromString;
