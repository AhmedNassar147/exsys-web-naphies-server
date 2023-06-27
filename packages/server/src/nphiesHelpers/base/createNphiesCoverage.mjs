/*
 *
 * Helpers: `createNphiesCoverage`.
 *
 */
import { capitalizeFirstLetter } from "@exsys-web-server/helpers";
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { PROFILE_COVERAGE } = NPHIES_BASE_PROFILE_TYPES;
const { COVERAGE } = NPHIES_RESOURCE_TYPES;
const { BASE_CODE_SYS_URL, BASE_TERMINOLOGY_CODE_SYS_URL } = NPHIES_API_URLS;
const { COVERAGE_TYPE, SUBSCRIBER_RELATIONSHIP, COVERAGE_CLASS } =
  NPHIES_BASE_CODE_TYPES;

const coverageClassUrl = `${BASE_TERMINOLOGY_CODE_SYS_URL}/${COVERAGE_CLASS}`;

const createNphiesCoverage = ({
  requestId,
  coverageType,
  memberId,
  patientId,
  subscriberPatientId,
  relationship,
  networkName,
  classes,
  payerOrganization,
  payerBaseUrl,
  providerOrganizationUrl,
  providerPatientUrl,
  providerCoverageUrl,
}) => {
  const patientUrlReference = `${providerPatientUrl}/${patientId}`;
  const subscriberUrl = subscriberPatientId
    ? `${providerPatientUrl}/${subscriberPatientId}`
    : patientUrlReference;

  if (!requestId) {
    return false;
  }

  const _memberId = memberId ? memberId.toString() : memberId;

  return {
    fullUrl: `${providerCoverageUrl}/${requestId}`,
    resource: {
      ...createNphiesBaseResource({
        resourceType: COVERAGE,
        profileType: PROFILE_COVERAGE,
        uuid: requestId,
      }),
      identifier: [
        {
          system: `${payerBaseUrl}/memberid`,
          value: _memberId,
        },
      ],
      status: "active",
      type: {
        coding: [
          {
            system: `${BASE_CODE_SYS_URL}/${COVERAGE_TYPE}`,
            code: coverageType || "EHCPOL",
            // "display": "extended healthcare"
          },
        ],
      },
      subscriber: {
        reference: subscriberUrl,
      },
      // subscriberId: _memberId,
      beneficiary: {
        reference: patientUrlReference,
      },
      ...(relationship
        ? {
            relationship: {
              coding: [
                {
                  system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/${SUBSCRIBER_RELATIONSHIP}`,
                  code: relationship,
                  display: capitalizeFirstLetter(relationship),
                },
              ],
            },
          }
        : null),
      payor: [
        {
          reference: `${providerOrganizationUrl}/${payerOrganization}`,
        },
      ],
      network: networkName,
      class:
        Array.isArray(classes) && classes.length
          ? classes.map(({ code, value, name }) => ({
              type: {
                coding: [
                  {
                    system: coverageClassUrl,
                    code,
                  },
                ],
              },
              value,
              name,
            }))
          : undefined,
    },
  };
};

export default createNphiesCoverage;
