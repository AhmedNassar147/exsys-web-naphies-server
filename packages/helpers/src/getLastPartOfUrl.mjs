/*
 *
 * Helper: `getLastPartOfUrl`.
 *
 */
const getLastPartOfUrl = (url, transformValue) => {
  if (url) {
    const [, lastPart] = url.match(/\/([^\/]+)\/?$/);

    return transformValue ? transformValue(lastPart) : lastPart;
  }

  return "";
};

export default getLastPartOfUrl;
