/*
 *
 * Helpers: `createCoverageEligibilityRequest`.
 *
 */
import { reverseDate, getCurrentDate } from "@exsys-web-server/helpers";
import createNphiesBaseResource from "../base/createNphiesBaseResource.mjs";
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
  providerOrganization,
  payerOrganization,
  periodStartDate,
  periodEndDate,
  patientId,
  businessArrangement,
  providerPatientUrl,
  providerOrganizationUrl,
  providerCoverageUrl,
  providerCoverageEligibilityUrl,
  providerLocationUrl,
  providerLocation,
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
          value: `req_${requestId}`,
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
        reference: `${providerOrganizationUrl}/${providerOrganization}`,
      },
      insurer: {
        reference: `${providerOrganizationUrl}/${payerOrganization}`,
      },
      facility: {
        reference: `${providerLocationUrl}/${providerLocation}`,
      },
      insurance: [
        {
          coverage: {
            reference: `${providerCoverageUrl}/${requestId}`,
          },
          businessArrangement,
        },
      ],
    },
  };
};

export default createCoverageEligibilityRequest;
