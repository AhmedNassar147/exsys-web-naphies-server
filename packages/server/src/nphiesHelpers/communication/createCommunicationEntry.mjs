/*
 *
 * Helper: `createCommunicationEntry`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import createNphiesBaseResource from "../base/createNphiesBaseResource.mjs";
import removeInvisibleCharactersFromString from "../../helpers/removeInvisibleCharactersFromString.mjs";
import ensureRequestPrefixAdded from "../../helpers/ensureRequestPrefixAdded.mjs";
import createNphiesAttachmentObject from "../base/createNphiesAttachmentObject.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
  NPHIES_RESOURCE_TYPES,
} from "../../constants.mjs";

const { PROFILE_COMMUNICATION, PROFILE_COMMUNICATION_REQUEST } =
  NPHIES_BASE_PROFILE_TYPES;
const { BASE_TERMINOLOGY_CODE_SYS_URL, BASE_CODE_SYS_URL, BASE_PROFILE_URL } =
  NPHIES_API_URLS;
const { COMMUNICATION_CAT, COMMUNICATION_REASON, EXTENSION_CLAIM_SEQ } =
  NPHIES_BASE_CODE_TYPES;
const { COMMUNICATION, COMMUNICATION_REQUEST } = NPHIES_RESOURCE_TYPES;

const createCommunicationEntry = ({
  requestId,
  providerFocusUrl,
  providerPatientUrl,
  providerOrganizationUrl,
  siteUrl,
  patientId,
  payerOrganization,
  providerOrganization,
  communicationStatus,
  communicationCategory,
  communicationResponseBasedOnType,
  communicationResponseBasedOnId,
  communicationPriority,
  communicationAboutType,
  communicationAboutId,
  communicationAboutSystemType,
  communicationPayload,
  isCommunicationRequest,
  communicationReason,
}) => {
  const resourceType = isCommunicationRequest
    ? COMMUNICATION_REQUEST
    : COMMUNICATION;
  const profileType = isCommunicationRequest
    ? PROFILE_COMMUNICATION_REQUEST
    : PROFILE_COMMUNICATION;

  PROFILE_COMMUNICATION_REQUEST;

  return {
    fullUrl: `${providerFocusUrl}/${requestId}`,
    resource: {
      ...createNphiesBaseResource({
        resourceType,
        profileType,
        uuid: requestId,
      }),
      identifier: [
        {
          system: providerFocusUrl.replace(resourceType, (value) =>
            value.toLowerCase()
          ),
          value: requestId,
        },
      ],
      ...(!!(communicationResponseBasedOnType && communicationResponseBasedOnId)
        ? {
            basedOn: [
              {
                type: communicationResponseBasedOnType,
                identifier: {
                  system: `${siteUrl}/${communicationResponseBasedOnType.toLowerCase()}`,
                  value: communicationResponseBasedOnId,
                },
              },
            ],
          }
        : null),
      status: communicationStatus,
      category: [
        {
          coding: [
            {
              system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/${COMMUNICATION_CAT}`,
              code: communicationCategory,
            },
          ],
        },
      ],
      priority: communicationPriority,
      subject: {
        reference: `${providerPatientUrl}/${patientId}`,
      },
      about: [
        {
          type: communicationAboutType,
          identifier: {
            system: `${siteUrl}/${communicationAboutSystemType}`,
            value: ensureRequestPrefixAdded(communicationAboutId),
          },
        },
      ],
      recipient: [
        {
          reference: `${providerOrganizationUrl}/${payerOrganization}`,
        },
      ],
      sender: {
        reference: `${providerOrganizationUrl}/${providerOrganization}`,
      },
      ...(communicationReason
        ? {
            reasonCode: [
              {
                coding: [
                  {
                    system: `${BASE_CODE_SYS_URL}/${COMMUNICATION_REASON}`,
                    code: communicationReason,
                  },
                ],
              },
            ],
          }
        : null),
      payload: isArrayHasData(communicationPayload)
        ? communicationPayload.map(
            ({
              value,
              contentType,
              title,
              creation,
              fileUrl,
              claimItemSequence,
            }) => {
              if (!contentType) {
                return {
                  ...(!!claimItemSequence
                    ? {
                        extension: [
                          {
                            url: `${BASE_PROFILE_URL}/${EXTENSION_CLAIM_SEQ}`,
                            valuePositiveInt: +claimItemSequence,
                          },
                        ],
                      }
                    : null),
                  contentString: removeInvisibleCharactersFromString(value),
                };
              }

              const contentAttachment = createNphiesAttachmentObject({
                title,
                creation,
                contentType,
                value,
                fileUrl,
              });

              return {
                contentAttachment,
              };
            }
          )
        : undefined,
    },
  };
};

export default createCommunicationEntry;
