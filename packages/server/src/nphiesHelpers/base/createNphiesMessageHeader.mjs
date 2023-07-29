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
  BASE_NPHIES_URL,
  NPHIES_REQUEST_TYPES,
} from "../../constants.mjs";

const { MESSAGE_HEADER } = NPHIES_BASE_PROFILE_TYPES;
const { KSA_MSG_EVENTS } = NPHIES_BASE_CODE_TYPES;
const { RESOURCE_MESSAGE_HEADER, ORGANIZATION } = NPHIES_RESOURCE_TYPES;
const {
  BASE_CODE_SYS_URL,
  PROVIDER_LICENSE_URL,
  PAYER_LICENSE_URL,
  NPHIES_LICENSE_OWNER_URL,
} = NPHIES_API_URLS;

const createNphiesMessageHeader = ({
  providerLicense,
  payerLicense,
  requestId,
  providerFocusUrl,
  requestType,
}) => {
  const isAuthorizationPollData = requestType === NPHIES_REQUEST_TYPES.POLL;
  const isCancellingPreauthOrClaimRequest =
    requestType === NPHIES_REQUEST_TYPES.CANCEL;

  const baseResourceData = createNphiesBaseResource({
    resourceType: RESOURCE_MESSAGE_HEADER,
    profileType: MESSAGE_HEADER,
  });

  const { id } = baseResourceData;
  const sourceEndPointBaseUrl =
    isAuthorizationPollData || isCancellingPreauthOrClaimRequest
      ? PROVIDER_LICENSE_URL
      : PAYER_LICENSE_URL;

  const destinationEndPointUrl = isAuthorizationPollData
    ? BASE_NPHIES_URL
    : `${PAYER_LICENSE_URL}/${payerLicense}`;

  const destinationIdentifierUrl = isAuthorizationPollData
    ? NPHIES_LICENSE_OWNER_URL
    : PAYER_LICENSE_URL;

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
          endpoint: destinationEndPointUrl,
          receiver: {
            type: ORGANIZATION,
            identifier: {
              system: destinationIdentifierUrl,
              value: isAuthorizationPollData ? "NPHIES" : payerLicense,
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
        endpoint: `${sourceEndPointBaseUrl}/${providerLicense}`,
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
