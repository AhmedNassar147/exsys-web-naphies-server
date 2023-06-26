/*
 *
 * Helper: `extractErrorsArray`.
 *
 */
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const extractErrorsArray = (nphiesError) =>
  Array.isArray(nphiesError) && nphiesError.length
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
