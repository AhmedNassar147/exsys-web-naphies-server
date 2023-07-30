/*
 *
 * Helper: `extractNphiesSentDataErrors`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";

const createAssignErrorToObjectError =
  ({ error, errorCode }) =>
  (matchWith, errorObject) => {
    if (error) {
      const regexp = new RegExp(`${matchWith}\\[\\d\\]`, "gm");

      const [valueWithIndex] = error.match(regexp) || [];
      const [index] = (valueWithIndex || "").match(/\d/g) || [];

      const mainErrorRegexp = new RegExp(
        `bundle.+${matchWith}\\[\\d\\].`,
        "gmi"
      );
      const mainError = error.replace(mainErrorRegexp, "");

      if (index) {
        const sequence = +index + 1;

        const previousSequenceError = errorObject[sequence];

        errorObject[sequence] = [
          previousSequenceError,
          `${mainError} ${errorCode ? `- {${errorCode}}` : ""}`,
        ]
          .filter(Boolean)
          .join("\n");

        return errorObject;
      }
    }

    return errorObject;
  };

const extractNphiesSentDataErrors = ({ claimErrors }) => {
  let productErrors = {};
  let diagnosisErrors = {};
  let supportInfoErrors = {};
  let otherClaimErrors = [];

  if (isArrayHasData(claimErrors)) {
    claimErrors.forEach((errorData) => {
      const { error } = errorData;
      const assignErrorToObjectError =
        createAssignErrorToObjectError(errorData);

      const hasItem = error.includes("resource.item[");
      const hasSupportInfo = error.includes("resource.supportingInfo[");
      const hasDiagnosis = error.includes("resource.diagnosis[");

      if (hasItem) {
        productErrors = assignErrorToObjectError("item", productErrors);
      }

      if (hasSupportInfo) {
        supportInfoErrors = assignErrorToObjectError(
          "supportingInfo",
          supportInfoErrors
        );
      }

      if (hasDiagnosis) {
        diagnosisErrors = assignErrorToObjectError(
          "diagnosis",
          diagnosisErrors
        );
      }

      if (!hasItem && !hasSupportInfo && !hasDiagnosis) {
        otherClaimErrors.push(errorData);
      }
    });
  }

  return {
    productErrors,
    diagnosisErrors,
    supportInfoErrors,
    otherClaimErrors,
  };
};

export default extractNphiesSentDataErrors;
