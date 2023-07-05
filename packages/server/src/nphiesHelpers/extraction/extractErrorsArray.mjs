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
          const { code: errorCode, display } =
            extractNphiesCodeAndDisplayFromCodingType(code);

          if (!(errorCode && display)) {
            return false;
          }

          return {
            error: display,
            errorCode,
          };
        })
        .filter(Boolean)
    : [];

export default extractErrorsArray;
