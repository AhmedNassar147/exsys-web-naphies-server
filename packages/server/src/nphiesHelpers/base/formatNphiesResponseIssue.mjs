/*
 *
 * Helper: `formatNphiesResponseIssue`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";

const formatNphiesResponseIssue = (issue) => {
  if (isArrayHasData(issue)) {
    const [{ details, expression }] = issue;
    const { code: issueErrorCode, display } =
      extractNphiesCodeAndDisplayFromCodingType(details);

    let issueError = display;

    if (isArrayHasData(expression)) {
      const [error] = expression;
      issueError = `${error || ""} ${display}`;
    }

    return {
      issueError,
      issueErrorCode,
    };
  }

  return null;
};

export default formatNphiesResponseIssue;
