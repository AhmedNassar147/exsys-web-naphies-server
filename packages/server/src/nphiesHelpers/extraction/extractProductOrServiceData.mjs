/*
 *
 * Helper: `extractProductOrServiceData`.
 *
 */
import { getLastPartOfUrl, isArrayHasData } from "@exsys-web-server/helpers";

const extractProductOrServiceData = (productOrService) => {
  const { coding } = productOrService || {};
  if (isArrayHasData(coding)) {
    const [
      { code: nphiesProductCode, display: nphiesProductName, system },
      customerItem,
    ] = coding;

    const { code: customerProductCode, display: customerProductName } =
      customerItem || {};

    const codeType = getLastPartOfUrl(system);

    return {
      nphiesProductCode,
      nphiesProductName,
      nphiesProductCodeType: codeType,
      customerProductCode,
      customerProductName,
    };
  }

  return {};
};

export default extractProductOrServiceData;
