/*
 *
 * Helper: `extractNphiesOutputErrors`.
 *
 */
import extractErrorsArray from "./extractErrorsArray.mjs";

const extractNphiesOutputErrors = (nphiesOutput) =>
  extractErrorsArray(nphiesOutput, "valueCodeableConcept");

export default extractNphiesOutputErrors;
