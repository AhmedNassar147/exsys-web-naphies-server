/*
 *
 * Helpers: `createCoverageEligibilityRequest`.
 *
 */
import createBaseEntryRequestData from "../base/createBaseEntryRequestData.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { ELIGIBILITY_REQUEST } = NPHIES_BASE_PROFILE_TYPES;
const { COVERAGE_ELIGIBILITY_REQUEST } = NPHIES_RESOURCE_TYPES;
const { EXTENSION_TRANSFER } = NPHIES_BASE_CODE_TYPES;
const { BASE_PROFILE_URL } = NPHIES_API_URLS;

const createCoverageEligibilityRequest = ({
  requestId,
  purpose,
  providerOrganization,
  payerOrganization,
  periodStartDate,
  periodEndDate,
  patientId,
  businessArrangement,
  providerPatientUrl,
  providerOrganizationUrl,
  providerCoverageUrl,
  providerFocusUrl,
  providerLocationUrl,
  providerLocation,
  isReferral,
}) => {
  const extension = isReferral
    ? [
        {
          url: `${BASE_PROFILE_URL}/${EXTENSION_TRANSFER}`,
          valueBoolean: true,
        },
      ]
    : undefined;

  const { fullUrl, resource } = createBaseEntryRequestData({
    requestId,
    providerOrganization,
    payerOrganization,
    patientId,
    businessArrangement,
    providerPatientUrl,
    providerOrganizationUrl,
    providerCoverageUrl,
    providerFocusUrl,
    resourceType: COVERAGE_ELIGIBILITY_REQUEST,
    profileType: ELIGIBILITY_REQUEST,
    extension,
  });

  return {
    fullUrl,
    resource: {
      ...resource,
      purpose,
      servicedPeriod: {
        start: periodStartDate,
        end: periodEndDate,
      },
      facility: {
        reference: `${providerLocationUrl}/${providerLocation}`,
      },
    },
  };
};

export default createCoverageEligibilityRequest;
