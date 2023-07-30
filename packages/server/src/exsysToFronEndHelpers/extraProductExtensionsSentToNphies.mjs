/*
 *
 * Helper: `extraProductExtensionsSentToNphies`.
 *
 */
const { isArrayHasData, toCamelCase } = require("@exsys-web-server/helpers");
import extractValueFromUrl from "../nphiesHelpers/extraction/extractValueFromUrl.mjs";
import { NPHIES_API_URLS } from "../constants.mjs";

const { BASE_PROFILE_URL } = NPHIES_API_URLS;

const extraProductExtensionsSentToNphies = (extension) => {
  if (isArrayHasData(extension)) {
    return extension.reduce(
      (acc, { valueMoney, valueIdentifier, valueBoolean, url }) => {
        const filedName = toCamelCase(
          extractValueFromUrl(url, BASE_PROFILE_URL).replace("-", " ")
        );

        let value = valueBoolean;

        if (valueMoney) {
          value = valueMoney.value;
        }

        if (valueIdentifier) {
          value = (valueIdentifier.value || "").replace(/Invc-|T_.+/g, "");
        }

        acc[filedName] = value;
        return acc;
      },
      {}
    );
  }

  return {};
};

export default extraProductExtensionsSentToNphies;
