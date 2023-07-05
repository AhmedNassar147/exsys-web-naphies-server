/*
 *
 * Helper: `formatNphiesResponseIssue`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";

const formatNphiesResponseIssue = (issue) => {
  if (isArrayHasData(issue)) {
    const [{ details }] = issue;
    const { code, display } =
      extractNphiesCodeAndDisplayFromCodingType(details);

    return {
      issueError: display,
      issueErrorCode: code,
    };
  }

  return null;
};

export default formatNphiesResponseIssue;
