/*
 *
 * Helper: `toCamelCase`.
 *
 */
const toCamelCase = (str, shouldNotLowerCaseInitials) => {
  const modifiedString = shouldNotLowerCaseInitials ? str : str.toLowerCase();

  return modifiedString.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) =>
    chr.toUpperCase()
  );
};

export default toCamelCase;
