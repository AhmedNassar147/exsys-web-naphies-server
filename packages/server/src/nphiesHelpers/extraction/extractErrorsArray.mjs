/*
 *
 * Helper: `extractErrorsArray`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractErrorsArray = (nphiesError, errorsFieldName = "code") =>
  isArrayHasData(nphiesError)
    ? nphiesError
        .map(({ [errorsFieldName]: codeType, valueString }) => {
          const {
            code: errorCode,
            display,
            extensionValue,
          } = extractNphiesCodeAndDisplayFromCodingType(codeType);

          if (!errorCode || ["status", "response"].includes(errorCode)) {
            return false;
          }

          return {
            error: [extensionValue, display, valueString]
              .filter(Boolean)
              .join(" / "),
            errorCode,
          };
        })
        .filter(Boolean)
    : [];

export default extractErrorsArray;
