/*
 *
 * Helper: `extractNphiesOutputErrors`.
 *
 */
import extractErrorsArray from "./extractErrorsArray.mjs";

const extractNphiesOutputErrors = (nphiesOutput, errorsFieldName) =>
  extractErrorsArray(nphiesOutput, errorsFieldName || "valueCodeableConcept");

export default extractNphiesOutputErrors;
