/*
 *
 * Helper: `extractProductOrServiceData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractValueFromUrl from "../nphiesHelpers/extraction/extractValueFromUrl.mjs";
import { NPHIES_API_URLS } from "../constants.mjs";

const { BASE_CODE_SYS_URL } = NPHIES_API_URLS;

const extractProductOrServiceData = (productOrService) => {
  const { coding } = productOrService || {};
  if (isArrayHasData(coding)) {
    const [
      { code: nphiesProductCode, display: nphiesProductName, system },
      customerItem,
    ] = coding;

    const { code: customerProductCode, display: customerProductName } =
      customerItem || {};

    const codeType = extractValueFromUrl(system, BASE_CODE_SYS_URL);

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
