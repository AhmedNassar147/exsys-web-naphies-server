/*
 *
 * Helper: `extractEligibilityDataSentToNphies`.
 *
 */
import {
  createDateFromNativeDate,
  isObjectHasData,
} from "@exsys-web-server/helpers";
import mapEntriesAndExtractNeededData from "../../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const dateOptions = {
  returnReversedDate: false,
};

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
    memberId,
    nphiesRequestExtractedData: nphiesRequestExtractedDataRes,
  } = result;

  const { policyNo, policyName, classCode, className } = !coverageClasses
    ? {
        policyNo: coverageSubscriberId,
        policyName: "",
        className: "",
        classCode: "",
      }
    : coverageClasses?.reduce(
        (acc, item) => {
          if (item) {
            const { key, value, name } = item;

            if (key === "class") {
              acc.classCode = value || name || "";
              acc.className = name || value || "";
            }

            if (key === "group") {
              acc.policyName = value || name || acc.policyName || "";
            }

            if (key === "plan") {
              acc.policyNo = value || acc.policyNo || "";

              if (!acc.policyName) {
                acc.policyName = name || "";
              }
            }
          }

          return acc;
        },
        {
          policyNo: coverageSubscriberId,
          policyName: "",
          className: "",
          classCode: "",
        },
      );

  const { benefitPeriodStart, benefitPeriodEnd, activeBenefitItems } =
    !insuranceBenefits
      ? {
          benefitPeriodStart: undefined,
          benefitPeriodEnd: undefined,
          activeBenefitItems: [],
        }
      : insuranceBenefits?.reduce(
          (acc, item) => {
            if (item) {
              const {
                benefitPeriodStart,
                benefitPeriodEnd,
                benefitInforce,
                benefitItems,
              } = item;

              if (benefitInforce === "Y") {
                acc.benefitPeriodStart = benefitPeriodStart;
                acc.benefitPeriodEnd = benefitPeriodEnd;

                acc.activeBenefitItems = benefitItems;
              }
            }

            return acc;
          },
          {
            benefitPeriodStart: undefined,
            benefitPeriodEnd: undefined,
            activeBenefitItems: [],
          },
        );

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
    insurer,
    receiver,
    policyHolderID,
    providerID,
    providerBundleId,
    policyHolderOrgBundleId,
    insurerBundleId,
    memberId: requestMemberId,
  } = nphiesRequestExtractedDataRes || {};

  const _coverageStartDate = createDateFromNativeDate(
    coverageStartDate,
    dateOptions,
  ).dateString;

  const _coverageEndDate = createDateFromNativeDate(
    coverageEndDate,
    dateOptions,
  ).dateString;

  const _benefitPeriodStart = benefitPeriodStart || _coverageStartDate;

  const _benefitPeriodEnd = benefitPeriodEnd || _coverageEndDate;
  return {
    bundleId: nphiesBundleId,
    creationBundleId,
    insurerBundleId,
    insurer,
    receiver,

    provider,
    providerID,
    providerBundleId,
    policyHolderID,
    policyHolderOrgBundleId,
    servicePeriod: [eligibilityPeriodStart, eligibilityPeriodEnd]
      .filter(Boolean)
      .join(" ~ "),
    priority,
    purpose,
    created,
    eligible: isPatientEligible === "Y",
    disposition: eligibilityDisposition,
    eligibilityErrors,
    patientFileNo: patientFileNo,
    patientName,
    patientBirthDate,
    patientGender,
    patientPhone,
    extensionOccupation,
    maritalStatusCode,
    patientIdentifierIdType,
    patientIdentifierId,
    memberId: memberId || requestMemberId,
    requestId,
    responseId: eligibilityResponseId,
    outcome: eligibilityOutcome,
    facilityName,
    facilityType,
    insuranceBenefits,
    policyNo,
    policyName,
    classCode,
    className,
    benefitPeriodStart: _benefitPeriodStart,
    benefitPeriodEnd: _benefitPeriodEnd,
    activeBenefitItems,
    coverageResponseId,
    coverageNetwork,
    relationship,
    coverageStatus,
    coverageStartDate: _coverageStartDate,
    coverageEndDate: _coverageEndDate,
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
