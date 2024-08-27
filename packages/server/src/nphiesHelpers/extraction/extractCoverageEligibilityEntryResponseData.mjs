/*
 *
 * Helper: `extractCoverageEligibilityEntryResponseData`.
 *
 */
import { createDateFromNativeDate } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractInsurancesData from "./extractInsurancesData.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractErrorsArray from "./extractErrorsArray.mjs";

const extractCoverageEligibilityEntryResponseData = ({
  resource: {
    resourceType,
    id,
    outcome,
    disposition,
    servicedPeriod,
    identifier,
    status,
    error,
    extension,
    insurance,
  },
}) => {
  const { start, end } = servicedPeriod || {};
  const [value, system] = extractIdentifierData(identifier);
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
    eligibilityPeriodStart: createDateFromNativeDate(start).dateString,
    eligibilityPeriodEnd: createDateFromNativeDate(end).dateString,
    eligibilityPayerClaimResponseUrl: system,
    eligibilityClaimResponse: value,
    eligibilityInsuranceBenefits: extractInsurancesData(insurance),
    isPatientEligible: isPatientEligible ? "Y" : "N",
    eligibilityErrors: errors,
  };
};

export default extractCoverageEligibilityEntryResponseData;
