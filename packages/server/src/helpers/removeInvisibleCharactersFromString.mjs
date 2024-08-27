/*
 *
 * helper: `removeInvisibleCharactersFromString`.
 *
 */

const removeInvisibleCharactersFromString = (value) => {
  if (!value) {
    return "";
  }

  return value.replace(/\s{1,300}/g, " ");
};

export default removeInvisibleCharactersFromString;
