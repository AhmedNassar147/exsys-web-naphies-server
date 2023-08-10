/*
 *
 * helper: `extractCoverageRelationship`.
 *
 */
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractCoverageRelationship = (relationship) => {
  const { code, display } =
    extractNphiesCodeAndDisplayFromCodingType(relationship);

  return display || code;
};

export default extractCoverageRelationship;
