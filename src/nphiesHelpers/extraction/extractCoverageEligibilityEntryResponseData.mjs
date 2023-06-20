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
    error: display,
    errorCode: code,
  };
};

export default extractCoverageEligibilityEntryResponseData;
