/*
 *
 * helper: `removeInvisibleCharactersFromString`.
 *
 */
const removeInvisibleCharactersFromString = (
  value,
  useCurrentValue,
  replaceWith
) => {
  if (!value) {
    return useCurrentValue ? value : "";
  }

  return (value || "").replace(
    /\s{1,300}|[^\x00-\x7F\u0600-\u06FF]/g,
    replaceWith ? replaceWith : " "
  );
};

export default removeInvisibleCharactersFromString;
