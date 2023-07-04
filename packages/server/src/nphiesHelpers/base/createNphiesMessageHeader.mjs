/*
 *
 * Helpers: `createNphiesMessageHeader`.
 *
 */
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { MESSAGE_HEADER } = NPHIES_BASE_PROFILE_TYPES;
const { KSA_MSG_EVENTS } = NPHIES_BASE_CODE_TYPES;
const { RESOURCE_MESSAGE_HEADER, ORGANIZATION } = NPHIES_RESOURCE_TYPES;
const { BASE_CODE_SYS_URL, PROVIDER_LICENSE_URL, PAYER_LICENSE_URL } =
  NPHIES_API_URLS;

const createNphiesMessageHeader = ({
  providerLicense,
  payerLicense,
  payerOrganization,
  requestId,
  providerFocusUrl,
  requestType,
}) => {
  const baseResourceData = createNphiesBaseResource({
    resourceType: RESOURCE_MESSAGE_HEADER,
    profileType: MESSAGE_HEADER,
  });

  const { id } = baseResourceData;

  return {
    fullUrl: `urn:uuid:${id}`,
    resource: {
      ...baseResourceData,
      eventCoding: {
        system: `${BASE_CODE_SYS_URL}/${KSA_MSG_EVENTS}`,
        code: `${requestType}-request`,
      },
      destination: [
        {
          endpoint: `${PAYER_LICENSE_URL}/${payerLicense}`,
          receiver: {
            type: ORGANIZATION,
            identifier: {
              system: PAYER_LICENSE_URL,
              value: payerLicense,
              // value: payerOrganization,
            },
          },
        },
      ],
      sender: {
        type: ORGANIZATION,
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
          reference: `${providerFocusUrl}/${requestId}`,
        },
      ],
    },
  };
};

export default createNphiesMessageHeader;
