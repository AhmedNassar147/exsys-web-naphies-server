/*
 *
 * Helper: `extractNphiesDataRelatedData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractNphiesDataRelatedData = (related) => {
  if (isArrayHasData(related)) {
    const [{ claim, relationship }] = related;
    const { identifier } = claim;
    const [value] = extractIdentifierData(identifier);

    const { code } = extractNphiesCodeAndDisplayFromCodingType(relationship);

    return {
      claimRelatedIdentifier: [(value || "").replace("req_", ""), code]
        .filter(Boolean)
        .join(" - "),
    };
  }

  return null;
};

export default extractNphiesDataRelatedData;
