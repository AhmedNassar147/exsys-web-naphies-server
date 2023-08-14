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
        .map(({ [errorsFieldName]: codeType }) => {
          const {
            code: errorCode,
            display,
            extensionValue,
          } = extractNphiesCodeAndDisplayFromCodingType(codeType);

          if (!errorCode) {
            return false;
          }

          return {
            error: `${extensionValue ? `${extensionValue} / ` : ""}${
              display || ""
            }`,
            errorCode,
          };
        })
        .filter(Boolean)
    : [];

export default extractErrorsArray;
