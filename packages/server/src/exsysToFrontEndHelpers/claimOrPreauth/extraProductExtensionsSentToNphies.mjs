/*
 *
 * Helper: `extraProductExtensionsSentToNphies`.
 *
 */
import { isArrayHasData, toCamelCase } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractValueFromUrl from "../../nphiesHelpers/extraction/extractValueFromUrl.mjs";
import { NPHIES_API_URLS } from "../../constants.mjs";

const { BASE_PROFILE_URL } = NPHIES_API_URLS;

const extraProductExtensionsSentToNphies = (extension) => {
  if (isArrayHasData(extension)) {
    return extension.reduce(
      (
        acc,
        { valueMoney, valueIdentifier, valueBoolean, url, valueCodeableConcept }
      ) => {
        const filedName = toCamelCase(
          extractValueFromUrl(url, BASE_PROFILE_URL).replace("-", " ")
        );

        let value = valueBoolean;

        if (valueMoney) {
          value = valueMoney.value;
        }

        if (valueIdentifier) {
          value = (valueIdentifier.value || "").replace(/Invc-|T_.+|_.+/g, "");
        }

        if (valueCodeableConcept) {
          const { code, display } =
            extractNphiesCodeAndDisplayFromCodingType(valueCodeableConcept);

          value = [display, code].filter(Boolean).join("/");
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
