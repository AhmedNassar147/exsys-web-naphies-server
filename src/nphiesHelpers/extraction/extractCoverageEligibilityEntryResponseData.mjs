/*
 *
 * Helper: `extractCoverageEligibilityEntryResponseData`.
 *
 */
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
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
  const [{ code: type }] = error || [{}];
  const { code, display } = extractNphiesCodeAndDisplayFromCodingType(type);
  const [{ valueCodeableConcept }] = extension || [{}];
  const { code: valueCodeableConceptCode } =
    extractNphiesCodeAndDisplayFromCodingType(valueCodeableConcept);

  const isPatientEligible =
    outcome === "complete" &&
    status === "active" &&
    valueCodeableConceptCode === "eligible";

  return {
    resourceType,
    responseId: id,
    status,
    outcome,
    disposition,
    periodStart: start,
    periodEnd: end,
    payerClaimResponseUrl: system,
    claimResponse: value,
    isPatientEligible: isPatientEligible ? "Y" : "N",
    error: display,
    errorCode: code,
  };
};

export default extractCoverageEligibilityEntryResponseData;
