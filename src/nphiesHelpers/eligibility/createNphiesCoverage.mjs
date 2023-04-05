/*
 *
 * Helpers: `createNphiesCoverage`.
 *
 */
import createNphiesBaseResource from "../base/createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { PROFILE_COVERAGE } = NPHIES_BASE_PROFILE_TYPES;
const { RESOURCE_COVERAGE } = NPHIES_RESOURCE_TYPES;
const { BASE_CODE_SYS_URL, BASE_TERMINOLOGY_CODE_SYS_URL } = NPHIES_API_URLS;
const { COVERAGE_TYPE, SUBSCRIBER_RELATIONSHIP, COVERAGE_CLASS } =
  NPHIES_BASE_CODE_TYPES;

const coverageClassUrl = `${BASE_TERMINOLOGY_CODE_SYS_URL}/${COVERAGE_CLASS}`;

const createNphiesCoverage = ({
  coverageId,
  coverageType,
  memberId,
  patientId,
  relationship,
  networkName,
  coverageClasses,
  payerOrganizationReference,
  payerBaseUrl,
  providerOrganizationUrl,
  providerPatientUrl,
  providerCoverageUrl,
}) => {
  const patientUrlReference = `${providerPatientUrl}/${patientId}`;

  return {
    fullUrl: `${providerCoverageUrl}/${coverageId}`,
    resource: {
      ...createNphiesBaseResource({
        resourceType: RESOURCE_COVERAGE,
        profileType: PROFILE_COVERAGE,
        uuid: coverageId,
      }),
      identifier: [
        {
          system: `${payerBaseUrl}/memberid`,
          value: memberId,
        },
      ],
      status: "active",
      type: {
        coding: [
          {
            system: `${BASE_CODE_SYS_URL}/${COVERAGE_TYPE}`,
            code: coverageType,
          },
        ],
      },
      subscriber: {
        reference: patientUrlReference,
      },
      subscriberId: memberId,
      beneficiary: {
        reference: patientUrlReference,
      },
      relationship: {
        coding: [
          {
            system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/${SUBSCRIBER_RELATIONSHIP}`,
            code: relationship,
          },
        ],
      },
      payor: [
        {
          reference: `${providerOrganizationUrl}/${payerOrganizationReference}`,
        },
      ],
      network: networkName,
      class:
        coverageClasses && coverageClasses.length
          ? coverageClasses.map(({ key, value, name }) => ({
              type: {
                coding: [
                  {
                    system: coverageClassUrl,
                    code: key,
                  },
                ],
              },
              value: value,
              name: name,
            }))
          : undefined,
    },
  };
};

export default createNphiesCoverage;
