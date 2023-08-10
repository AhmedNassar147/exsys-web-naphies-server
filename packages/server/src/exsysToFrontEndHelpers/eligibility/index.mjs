/*
 *
 * Helper: `extractNphiesEligibilityData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import mapEntriesAndExtractNeededData from "../../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import formatNphiesResponseIssue from "../../nphiesHelpers/base/formatNphiesResponseIssue.mjs";
import extractPatientData from "../base/extractPatientData.mjs";
import extractOrganizationData from "../base/extractOrganizationData.mjs";
import extractInsurancesData from "../../nphiesHelpers/extraction/extractInsurancesData.mjs";
import extractCoverageRelationship from "../../nphiesHelpers/extraction/extractCoverageRelationship.mjs";

const extractionFunctionsMap = {
  CoverageEligibilityRequest: ({
    resource: { priority, created, purpose, id },
  }) => ({
    created,
    priority: extractNphiesCodeAndDisplayFromCodingType(priority).code,
    purpose: purpose.join(", "),
    requestId: id,
  }),
  Location: ({ resource: { name, type } }) => ({
    facilityName: name,
    facilityType: extractNphiesCodeAndDisplayFromCodingType(
      isArrayHasData(type) ? type[0] : type
    ).code,
  }),
  Organization: extractOrganizationData("prov"),
  Organization: extractOrganizationData("ins"),
  Patient: extractPatientData,
};

const nphiesResponseExtractionFunctionsMap = {
  CoverageEligibilityResponse: ({ resource: { insurance } }) => ({
    insuranceBenefits: extractInsurancesData(insurance),
  }),
  Coverage: ({ resource: { relationship } }) => ({
    relationship: extractCoverageRelationship(relationship),
  }),
};

const extractNphiesEligibilityData = ({
  nodeServerDataSentToNaphies,
  nphiesResponse,
  nphiesExtractedData,
}) => {
  const { id: creationBundleId } = nodeServerDataSentToNaphies || {};
  const { issue } = nphiesResponse || {};

  const issueValues = formatNphiesResponseIssue(issue);

  const {
    patientFileNo,
    patientName,
    patientBirthDate,
    patientGender,
    patientPhone,
    patientIdentifierIdType,
    insurer,
    requestId,
    provider,
    priority,
    purpose,
    created,
    facilityName,
    facilityType,
  } = mapEntriesAndExtractNeededData({
    nphiesResponse: nodeServerDataSentToNaphies,
    extractionFunctionsMap,
    creationBundleId,
  });

  const { insuranceBenefits, relationship } = mapEntriesAndExtractNeededData({
    nphiesResponse: nphiesResponse,
    extractionFunctionsMap: nphiesResponseExtractionFunctionsMap,
    creationBundleId,
  });

  const {
    bundleId: nphiesBundleId,
    eligibilityDisposition,
    isPatientEligible,
    eligibilityPeriodStart,
    eligibilityPeriodEnd,
    eligibilityResponseId,
    eligibilityOutcome,
    eligibilityErrors,
    coverageResponseId,
    coverageNetwork,
    coverageCopayPct,
    coverageCopayPctCode,
    coverageMaxCopay,
    coverageCurrency,
    coverageClasses,
    coverageErrors,
  } = nphiesExtractedData;

  return {
    bundleId: nphiesBundleId,
    creationBundleId,
    insurer,
    provider,
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
    patientIdentifierIdType,
    requestId,
    responseId: eligibilityResponseId,
    outcome: eligibilityOutcome,
    facilityName,
    facilityType,
    coverageResponseId,
    coverageNetwork,
    relationship,
    coverageCopayPct,
    coverageCopayPctCode,
    coverageMaxCopay,
    coverageCurrency,
    coverageClasses,
    coverageErrors,
    ...issueValues,
    nodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    nphiesResponse,
  };
};

export default extractNphiesEligibilityData;
