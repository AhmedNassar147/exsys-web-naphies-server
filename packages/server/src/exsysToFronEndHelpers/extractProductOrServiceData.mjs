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
  if (isArrayHasData(productOrService)) {
    const [
      { code: nphiesProductCode, display: nphiesProductName, system },
      customerItem,
    ] = productOrService;

    const { code: customerProductCode, display: customerProductName } =
      customerItem || {};

    return {
      nphiesProductCode,
      nphiesProductName,
      nphiesProductCodeType: extractValueFromUrl(system, BASE_CODE_SYS_URL),
      customerProductCode,
      customerProductName,
    };
  }

  return {};
};

export default extractProductOrServiceData;
