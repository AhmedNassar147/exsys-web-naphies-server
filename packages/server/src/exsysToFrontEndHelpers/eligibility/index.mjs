/*
 *
 * Helper: `extractEligibilityDataSentToNphies`.
 *
 */
import { isObjectHasData } from "@exsys-web-server/helpers";
import mapEntriesAndExtractNeededData from "../../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const extractEligibilityDataSentToNphies = ({
  nodeServerDataSentToNaphies,
  nphiesResponse,
  nphiesExtractedData,
}) => {
  if (!isObjectHasData(nphiesExtractedData)) {
    return {};
  }

  const { nphiesRequestExtractedData } = nphiesExtractedData;

  const result = isObjectHasData(nphiesRequestExtractedData)
    ? nphiesExtractedData
    : mapEntriesAndExtractNeededData({
        requestType: NPHIES_REQUEST_TYPES.ELIGIBILITY,
        nphiesResponse,
        nodeServerDataSentToNaphies,
        defaultValue: {},
      });

  const {
    bundleId: nphiesBundleId,
    creationBundleId,
    eligibilityDisposition,
    isPatientEligible,
    eligibilityPeriodStart,
    eligibilityPeriodEnd,
    eligibilityResponseId,
    eligibilityOutcome,
    eligibilityErrors,
    coverageStatus,
    coverageStartDate,
    coverageEndDate,
    coverageType,
    coverageResponseId,
    coverageNetwork,
    coverageCopayPct,
    coverageCopayPctCode,
    coverageMaxCopay,
    coverageCurrency,
    coverageClasses,
    coverageSubscriberId,
    coverageErrors,
    issueError,
    issueErrorCode,
    insuranceBenefits,
    nphiesRequestExtractedData: nphiesRequestExtractedDataRes,
  } = result;

  const {
    patientFileNo,
    patientName,
    patientBirthDate,
    patientGender,
    patientPhone,
    patientIdentifierIdType,
    patientIdentifierId,
    requestId,
    provider,
    priority,
    purpose,
    created,
    facilityName,
    facilityType,
    extensionOccupation,
    maritalStatusCode,
    relationship,
    memberId,
    insurer,
    receiver,
    policyHolderID,
    providerID,
  } = nphiesRequestExtractedDataRes || {};

  return {
    bundleId: nphiesBundleId,
    creationBundleId,
    insurer,
    receiver,
    provider,
    policyHolderID,
    providerID,
    servicePeriod: [eligibilityPeriodStart, eligibilityPeriodEnd]
      .filter(Boolean)
      .join(" ~ "),
    priority,
    purpose,
    created,
    eligible: isPatientEligible === "Y",
    disposition: eligibilityDisposition,
    eligibilityErrors,
    insuranceBenefits,
    patientFileNo,
    patientName,
    patientBirthDate,
    patientGender,
    patientPhone,
    extensionOccupation,
    maritalStatusCode,
    patientIdentifierIdType,
    patientIdentifierId,
    memberId,
    requestId,
    responseId: eligibilityResponseId,
    outcome: eligibilityOutcome,
    facilityName,
    facilityType,
    coverageResponseId,
    coverageNetwork,
    relationship,
    coverageStatus,
    coverageStartDate,
    coverageEndDate,
    coverageType,
    coverageSubscriberId,
    coverageCopayPct,
    coverageCopayPctCode,
    coverageMaxCopay,
    coverageCurrency,
    coverageClasses,
    coverageErrors,
    issueError,
    issueErrorCode,
    nodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    nphiesResponse,
  };
};

export default extractEligibilityDataSentToNphies;
