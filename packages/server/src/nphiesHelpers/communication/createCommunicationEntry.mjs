/*
 *
 * Helper: `createCommunicationEntry`.
 *
 */
import { isArrayHasData, reverseDate } from "@exsys-web-server/helpers";
import createNphiesBaseResource from "../base/createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
  NPHIES_RESOURCE_TYPES,
} from "../../constants.mjs";

const { PROFILE_COMMUNICATION } = NPHIES_BASE_PROFILE_TYPES;
const { BASE_TERMINOLOGY_CODE_SYS_URL } = NPHIES_API_URLS;
const { COMMUNICATION_CAT } = NPHIES_BASE_CODE_TYPES;
const { COMMUNICATION } = NPHIES_RESOURCE_TYPES;

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
}) => {
  return {
    fullUrl: `${providerFocusUrl}/${requestId}`,
    resource: {
      ...createNphiesBaseResource({
        resourceType: COMMUNICATION,
        profileType: PROFILE_COMMUNICATION,
        uuid: requestId,
      }),
      identifier: [
        {
          system: providerFocusUrl.replace(COMMUNICATION, (value) =>
            value.toLowerCase()
          ),
          value: `req_${requestId}`,
        },
      ],
      ...(!!(communicationResponseBasedOnType && communicationResponseBasedOnId)
        ? {
            basedOn: [
              {
                type: communicationResponseBasedOnType,
                identifier: {
                  system: `${siteUrl}/${communicationResponseBasedOnType.toLowerCase()}`,
                  value: `req_${communicationResponseBasedOnId}`,
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
            value: `req_${communicationAboutId}`,
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
      payload: isArrayHasData(communicationPayload)
        ? communicationPayload
            .map(({ value, contentType, title, creation }) => {
              if (!contentType) {
                return { contentString: value || "" };
              }

              let _title = title || "";

              if (contentType) {
                _title += ` ${contentType.replace("/", ".")}`;
              }

              return false;

              return {
                contentAttachment: {
                  title: _title,
                  creation: reverseDate(creation),
                  contentType,
                  data: value,
                },
              };
            })
            .filter(Boolean)
        : undefined,
    },
  };
};

export default createCommunicationEntry;
