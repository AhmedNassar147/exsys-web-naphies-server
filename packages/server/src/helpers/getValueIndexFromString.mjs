/*
 *
 * Helper: `getValueIndexFromString`.
 *
 */
const getValueIndexFromString = (mainString, matchWith) => {
  matchWith = matchWith.replace(/\[/g, "");
  const regexp = new RegExp(`${matchWith}\\[\\d{0,}\\]`, "gm");

  const [valueWithIndex] = mainString.match(regexp) || [];
  const index = (valueWithIndex || "").replace(/\D/g, "");

  return index;
};

export default getValueIndexFromString;
