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
}) => {
  const { start, end } = servicedPeriod || {};
  const [{ system, value }] = identifier || [{}];
  const [{ code: type }] = error || [{}];
  const { code, display } = extractNphiesCodeAndDisplayFromCodingType(type);

  const isPatientEligible =
    outcome === "complete" &&
    status === "active" &&
    disposition === "Coverage is in-force";

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
    isPatientEligible,
    error: display,
    errorCode: code,
  };
};

export default extractCoverageEligibilityEntryResponseData;
