/*
 *
 * Helper: `extractExtensionsSentToNphies`.
 *
 */
import {
  getLastPartOfUrl,
  isArrayHasData,
  toCamelCase,
} from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractExtensionsSentToNphies = (extension, accessorName) => {
  if (isArrayHasData(extension)) {
    return extension.reduce(
      (
        acc,
        { valueMoney, valueIdentifier, valueBoolean, url, valueCodeableConcept }
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

export default extractExtensionsSentToNphies;
