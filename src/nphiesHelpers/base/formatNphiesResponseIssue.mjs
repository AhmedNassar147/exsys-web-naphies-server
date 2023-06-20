/*
 *
 * Helper: `formatNphiesResponseIssue`.
 *
 */
import extractNphiesCodeAndDisplayFromCodingType from "../extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";

const formatNphiesResponseIssue = (issue) => {
  if (Array.isArray(issue) && issue.length) {
    const [details] = issue;
    const { code, display } =
      extractNphiesCodeAndDisplayFromCodingType(details);

    return {
      error: display,
      errorCode: code,
    };
  }

  return null;
};

export default formatNphiesResponseIssue;
