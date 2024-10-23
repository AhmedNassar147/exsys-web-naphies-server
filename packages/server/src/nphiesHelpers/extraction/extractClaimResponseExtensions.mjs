/*
 *
 * Helper: `extractClaimResponseExtensions`.
 *
 */
import {
  formatDateToNativeDateParts,
  getLastPartOfUrl,
  isArrayHasData,
  toCamelCase,
} from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const formatDate = (date, ignoreTime) =>
  formatDateToNativeDateParts(date, {
    stringifyReturnedDate: true,
    ignoreTime,
  });

const extractClaimResponseExtensions = (extension) => {
  if (isArrayHasData(extension)) {
    return extension.reduce(
      (
        acc,
        {
          url,
          valueCodeableConcept,
          valueBoolean,
          valuePositiveInt,
          valuePeriod,
          valueIdentifier,
          valueMoney,
          valueString,
          valueReference,
          valueDate,
        }
      ) => {
        const { code, display } =
          extractNphiesCodeAndDisplayFromCodingType(valueCodeableConcept);

        if (url.includes("extension-adjudication-outcome")) {
          acc.claimExtensionCode = code;
          return acc;
        }

        const lastPartValue = getLastPartOfUrl(url, toCamelCase);

        if (lastPartValue) {
          const hasValueInt = typeof valuePositiveInt === "number";
          const hasValueBoolean = typeof valueBoolean === "boolean";

          let finalValue = [display, code].filter(Boolean).join("/");

          if (hasValueInt) {
            finalValue = valuePositiveInt;
          }

          if (hasValueBoolean) {
            finalValue = valueBoolean;
          }

          if (valuePeriod) {
            const { start, end } = valuePeriod;
            finalValue = [formatDate(start), formatDate(end)]
              .filter(Boolean)
              .join(" ~ ");
          }

          if (valueDate) {
            finalValue = formatDate(valueDate);
          }

          if (valueIdentifier) {
            const { value } = valueIdentifier;
            finalValue = (value || "").replace(/Invc-|EpisodeID-|\/T.+/g, "");
          }

          if (valueMoney) {
            finalValue = valueMoney.value;
          }

          if (valueString) {
            finalValue = valueString;
          }

          if (valueReference) {
            const { identifier, reference } = valueReference;
            const { value: identifierValue } = identifier || {};

            finalValue = reference
              ? getLastPartOfUrl(reference)
              : (identifierValue || "").replace("resp_", "");
          }

          acc.extensionOthersValues[lastPartValue] = finalValue;
        }

        return acc;
      },
      {
        claimExtensionCode: "",
        extensionOthersValues: {},
      }
    );
  }

  return {
    claimExtensionCode: "",
    extensionOthersValues: {},
  };
};

export default extractClaimResponseExtensions;
