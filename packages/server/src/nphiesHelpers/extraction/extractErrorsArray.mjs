/*
 *
 * Helper: `extractErrorsArray`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractErrorsArray = (nphiesError) =>
  isArrayHasData(nphiesError)
    ? nphiesError
        .map(({ code }) => {
          const {
            code: errorCode,
            display,
            extensionValue,
          } = extractNphiesCodeAndDisplayFromCodingType(code);

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
