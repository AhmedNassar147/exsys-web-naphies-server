/*
 *
 * Helper: `extractExtensionsSentToNphies`.
 *
 */
import {
  formatDateToNativeDateParts,
  getLastPartOfUrl,
  isArrayHasData,
  toCamelCase,
} from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const formatDate = (date) =>
  formatDateToNativeDateParts(date, {
    stringifyReturnedDate: true,
  });

const extractExtensionsSentToNphies = (extension, accessorName) => {
  if (isArrayHasData(extension)) {
    return extension.reduce(
      (
        acc,
        {
          valueMoney,
          valueIdentifier,
          valueBoolean,
          url,
          valueString,
          valueCodeableConcept,
          valueDate,
          valueReference,
          valuePeriod,
        }
      ) => {
        let filedName = toCamelCase(
          getLastPartOfUrl(url, (value) => value.replace("-", " "))
        );

        if (accessorName || typeof accessorName === "string") {
          filedName = filedName.replace("extension", accessorName);
        }

        let value = valueBoolean;

        if (valueMoney) {
          value = valueMoney.value;
        }

        if (valueIdentifier) {
          value = (valueIdentifier.value || "").replace(
            /Invc-|EpisodeID-|\/T.+/g,
            ""
          );
        }

        if (valueString) {
          value = valueString;
        }

        if (valueDate) {
          value = formatDate(valueDate);
        }

        if (valuePeriod) {
          const { start, end } = valuePeriod;
          value = [formatDate(start), formatDate(end)]
            .filter(Boolean)
            .join(" ~ ");
        }

        if (valueReference) {
          const { identifier, reference } = valueReference;
          const { value: identifierValue } = identifier || {};

          value = reference
            ? getLastPartOfUrl(reference) || undefined
            : (identifierValue || "").replace("resp_", "");
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

export default extractExtensionsSentToNphies;
