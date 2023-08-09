/*
 *
 * helper: `extractCoverageData`.
 *
 */
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractCoverageData = ({ resource: { relationship } }) => {
  const { code, display } =
    extractNphiesCodeAndDisplayFromCodingType(relationship);

  return {
    relationship: display || code,
  };
};

export default extractCoverageData;
