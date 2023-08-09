/*
 *
 * helper: `extractOrganizationData`.
 *
 */
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractOrganizationData = ({ resource: { name, identifier, type } }) => {
  const [{ value }] = identifier || [{}];
  const { code } = extractNphiesCodeAndDisplayFromCodingType(type);

  const insurerOrProvider = [value, name]
    .filter(Boolean)
    .join(" ")
    .replace(/\n|\t/, "");

  if (code === "ins") {
    return {
      insurer: insurerOrProvider,
      receiver: value,
    };
  }

  return {
    provider: insurerOrProvider,
  };
};

export default extractOrganizationData;
