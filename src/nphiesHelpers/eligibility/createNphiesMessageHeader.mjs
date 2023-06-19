/*
 *
 * Helpers: `createNphiesMessageHeader`.
 *
 */
import createNphiesBaseResource from "../base/createNphiesBaseResource.mjs";
import removeNphiesProfileVersion from "../base/removeNphiesProfileVersion.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { MESSAGE_HEADER, ELIGIBILITY_REQUEST } = NPHIES_BASE_PROFILE_TYPES;
const { KSA_MSG_EVENTS } = NPHIES_BASE_CODE_TYPES;
const { RESOURCE_MESSAGE_HEADER } = NPHIES_RESOURCE_TYPES;
const { BASE_CODE_SYS_URL, PROVIDER_LICENSE_URL, PAYER_LICENSE_URL } =
  NPHIES_API_URLS;

const createNphiesMessageHeader = ({
  providerLicense,
  payerLicense,
  requestId,
  providerCoverageEligibilityUrl,
  providerMessageHeaderUrl,
}) => {
  const baseResourceData = createNphiesBaseResource({
    resourceType: RESOURCE_MESSAGE_HEADER,
    profileType: MESSAGE_HEADER,
  });

  const { id } = baseResourceData;

  return {
    fullUrl: `${providerMessageHeaderUrl}/${id}`,
    resource: {
      ...baseResourceData,
      eventCoding: {
        system: `${BASE_CODE_SYS_URL}/${KSA_MSG_EVENTS}`,
        code: removeNphiesProfileVersion(ELIGIBILITY_REQUEST),
      },
      destination: [
        {
          endpoint: `${PAYER_LICENSE_URL}/${payerLicense}`,
          receiver: {
            type: "Organization",
            identifier: {
              system: PAYER_LICENSE_URL,
              value: payerLicense,
            },
          },
        },
      ],
      sender: {
        type: "Organization",
        identifier: {
          system: PROVIDER_LICENSE_URL,
          value: providerLicense,
        },
      },
      source: {
        endpoint: `${PAYER_LICENSE_URL}/${providerLicense}`,
      },
      focus: [
        {
          reference: `${providerCoverageEligibilityUrl}/${requestId}`,
        },
      ],
    },
  };
};

export default createNphiesMessageHeader;
