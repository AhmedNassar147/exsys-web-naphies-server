/*
 *
 * Helpers: `createCoverageEligibilityRequest`.
 *
 */
import createNphiesBaseResource from "../base/createNphiesBaseResource.mjs";
import reverseDate from "../../nodeHelpers/reverseDate.mjs";
import getCurrentDate from "../../nodeHelpers/getCurrentDate.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { ELIGIBILITY_REQUEST } = NPHIES_BASE_PROFILE_TYPES;
const { COVERAGE_ELIGIBILITY_REQUEST } = NPHIES_RESOURCE_TYPES;
const { BASE_TERMINOLOGY_CODE_SYS_URL } = NPHIES_API_URLS;
const { PROCESS_PRIORITY } = NPHIES_BASE_CODE_TYPES;

const createCoverageEligibilityRequest = ({
  requestId,
  purpose,
  priorityCode,
  providerOrganizationReference,
  payerOrganizationReference,
  periodStartDate,
  periodEndDate,
  coverageId,
  patientId,
  businessArrangement,
  providerPatientUrl,
  providerOrganizationUrl,
  providerCoverageUrl,
  providerCoverageEligibilityUrl,
  providerLocationUrl,
  providerLocationReference,
}) => {
  const { dateString } = getCurrentDate();

  return {
    fullUrl: `${providerCoverageEligibilityUrl}/${requestId}`,
    resource: {
      ...createNphiesBaseResource({
        resourceType: COVERAGE_ELIGIBILITY_REQUEST,
        profileType: ELIGIBILITY_REQUEST,
        uuid: requestId,
      }),
      identifier: [
        {
          system: providerCoverageEligibilityUrl,
          value: requestId,
          // "value": "req_161490" in json file but not found in anywhere
        },
      ],
      status: "active",
      priority: {
        coding: [
          {
            system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/${PROCESS_PRIORITY}`,
            code: priorityCode,
          },
        ],
      },
      purpose,
      patient: {
        reference: `${providerPatientUrl}/${patientId}`,
      },
      servicedPeriod: {
        start: reverseDate(periodStartDate),
        end: reverseDate(periodEndDate),
      },
      created: reverseDate(dateString),
      provider: {
        reference: `${providerOrganizationUrl}/${providerOrganizationReference}`,
      },
      insurer: {
        reference: `${providerOrganizationUrl}/${payerOrganizationReference}`,
      },
      facility: {
        reference: `${providerLocationUrl}/${providerLocationReference}`,
      },
      insurance: [
        {
          coverage: {
            reference: `${providerCoverageUrl}/${coverageId}`,
          },
          businessArrangement,
        },
      ],
    },
  };
};

export default createCoverageEligibilityRequest;
