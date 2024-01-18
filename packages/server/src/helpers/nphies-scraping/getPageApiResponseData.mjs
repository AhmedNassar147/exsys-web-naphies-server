/*
 *
 * Helper: `getPageApiResponseData`.
 *
 */
const getPageApiResponseData = async (response, limitedApiUrls) => {
  const url = response.request().url();
  const isValidApiUrl = limitedApiUrls.some((limitedApiUrl) =>
    url.includes(limitedApiUrl)
  );

  const urlObject = new URL(url);

  const searchParams = Array.from(urlObject.searchParams).reduce(
    (acc, [key, value]) => {
      acc[key] = value;
      return acc;
    },
    {}
  );

  if (!isValidApiUrl) {
    return {
      url,
      searchParams,
      isValidApiUrl: false,
    };
  }

  const headers = response.headers() || {};
  const contentType = headers["content-type"];
  const contentLength = headers["content-length"];
  const isJsonResponse = (contentType || "").includes("application/json");
  const isHtmlResponse = (contentType || "").includes("text/html");
  let result = undefined;

  if (contentLength) {
    result = await (isJsonResponse ? response.json() : response.text());

    if (isHtmlResponse && result) {
    }
  } else {
    result = (await response.buffer()).toString();
  }

  return {
    url,
    searchParams,
    isValidApiUrl,
    contentType,
    contentLength,
    isJsonResponse,
    isHtmlResponse,
    result,
  };
};

export default getPageApiResponseData;
