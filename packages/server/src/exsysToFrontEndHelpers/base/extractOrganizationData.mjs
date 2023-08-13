/*
 *
 * helper: `extractOrganizationData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractOrganizationData =
  (codeValue) =>
  ({ resource: { name, identifier, type } }) => {
    const [{ value }] = identifier || [{}];
    const { code } = extractNphiesCodeAndDisplayFromCodingType(
      isArrayHasData(type) ? type[0] : type
    );

    const insurerOrProvider = [value, name]
      .filter(Boolean)
      .join(" ")
      .replace(/\n|\t/, "");

    const isInSurer = code === codeValue && codeValue === "ins";

    if (isInSurer) {
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
