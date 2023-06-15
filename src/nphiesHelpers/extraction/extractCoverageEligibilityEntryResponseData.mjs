/*
 *
 * Helper: `extractCoverageEligibilityEntryResponseData`.
 *
 */
const extractCoverageEligibilityEntryResponseData = ({
  resourceType,
  id,
  outcome,
  disposition,
  servicedPeriod,
  identifier,
  status,
}) => {
  const { start, end } = servicedPeriod || {};
  const [{ system, value }] = identifier || [{}];

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
  };
};

export default extractCoverageEligibilityEntryResponseData;
