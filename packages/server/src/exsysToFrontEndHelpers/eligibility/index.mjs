/*
 *
 * Helper: `extractEligibilityDataSentToNphies`.
 *
 */
import { isArrayHasData, writeResultFile } from "@exsys-web-server/helpers";
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

const extractionFunctionsMapForInsuranceOrg = {
  Organization: extractOrganizationData("ins"),
};

const extractEligibilityDataSentToNphies = ({
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
    defaultValue: {},
  });

  const { insuranceBenefits, relationship } = mapEntriesAndExtractNeededData({
    nphiesResponse: nphiesResponse,
    extractionFunctionsMap: nphiesResponseExtractionFunctionsMap,
    creationBundleId,
    defaultValue: {},
  });

  const { insurer, receiver } = mapEntriesAndExtractNeededData({
    nphiesResponse: nodeServerDataSentToNaphies,
    extractionFunctionsMap: extractionFunctionsMapForInsuranceOrg,
    creationBundleId,
    defaultValue: {},
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
  } = nphiesExtractedData || {};

  return {
    bundleId: nphiesBundleId,
    creationBundleId,
    insurer,
    receiver,
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

export default extractEligibilityDataSentToNphies;
