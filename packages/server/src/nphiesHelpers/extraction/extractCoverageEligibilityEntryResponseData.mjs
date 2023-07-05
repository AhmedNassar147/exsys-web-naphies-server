/*
 *
 * Helper: `extractCoverageEligibilityEntryResponseData`.
 *
 */
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractErrorsArray from "./extractErrorsArray.mjs";

const extractCoverageEligibilityEntryResponseData = ({
  resourceType,
  id,
  outcome,
  disposition,
  servicedPeriod,
  identifier,
  status,
  error,
  extension,
}) => {
  const { start, end } = servicedPeriod || {};
  const [{ system, value }] = identifier || [{}];
  const [{ valueCodeableConcept }] = extension || [{}];
  const { code: valueCodeableConceptCode } =
    extractNphiesCodeAndDisplayFromCodingType(valueCodeableConcept);
  const errors = extractErrorsArray(error);

  const isPatientEligible =
    outcome === "complete" &&
    status === "active" &&
    valueCodeableConceptCode === "eligible";

  return {
    eligibilityResourceType: resourceType,
    eligibilityResponseId: id,
    eligibilityStatus: status,
    eligibilityOutcome: outcome,
    eligibilityDisposition: `${
      valueCodeableConceptCode
        ? `site eligibility (${valueCodeableConceptCode})`
        : ""
    }${disposition ? ` - ${disposition}` : ""}`,
    eligibilityPeriodStart: start,
    eligibilityPeriodEnd: end,
    eligibilityPayerClaimResponseUrl: system,
    eligibilityClaimResponse: value,
    isPatientEligible: isPatientEligible ? "Y" : "N",
    eligibilityErrors: errors,
  };
};

export default extractCoverageEligibilityEntryResponseData;
