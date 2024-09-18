/*
 *
 * Helpers: `createNphiesEncounter`.
 *
 */
import {
  createTimestamp,
  formatDateToNativeDateParts,
} from "@exsys-web-server/helpers";
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { PROFILE_ENCOUNTER } = NPHIES_BASE_PROFILE_TYPES;
const { EXTENSION_SERVICE_EVENT_TYPE, CODE_SERVICE_EVENT_TYPE } =
  NPHIES_BASE_CODE_TYPES;
const { ENCOUNTER } = NPHIES_RESOURCE_TYPES;
const { BASE_CODE_SYS_URL, BASE_PROFILE_URL, BASE_TERMINOLOGY_CODE_SYS_URL } =
  NPHIES_API_URLS;

const createNphiesEncounter = ({
  encounterUrl,
  requestId,
  encounterServiceEventType,
  encounterIdentifier,
  encounterStatus,
  encounterClassCode,
  encounterClassDisplay,
  encounterServiceType,
  encounterPeriodStart,
  encounterPeriodEnd,
  providerPatientUrl,
  patientFileNo,
  organizationReference,
  providerOrganizationUrl,
}) => {
  const baseResourceData = createNphiesBaseResource({
    resourceType: ENCOUNTER,
    profileType: PROFILE_ENCOUNTER,
    uuid: requestId,
  });

  return {
    fullUrl: `${encounterUrl}/${requestId}`,
    resource: {
      ...baseResourceData,
      extension: [
        {
          url: `${BASE_PROFILE_URL}/${EXTENSION_SERVICE_EVENT_TYPE}`,
          valueCodeableConcept: {
            coding: [
              {
                system: `${BASE_CODE_SYS_URL}/${CODE_SERVICE_EVENT_TYPE}`,
                code: encounterServiceEventType,
              },
            ],
          },
        },
      ],
      identifier: [
        {
          system: encounterUrl.replace(ENCOUNTER, ENCOUNTER.toLowerCase()),
          value: encounterIdentifier,
        },
      ],
      status: encounterStatus,
      class: {
        system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/v3-ActCode`,
        code: encounterClassCode,
        display: encounterClassDisplay,
      },
      serviceType: {
        coding: [
          {
            system: `${BASE_CODE_SYS_URL}/${CODE_SERVICE_EVENT_TYPE.replace(
              "event-",
              ""
            )}`,
            code: encounterServiceType,
          },
        ],
      },
      subject: {
        reference: `${providerPatientUrl}/${patientFileNo}`,
      },
      period: {
        start: createTimestamp(
          formatDateToNativeDateParts(encounterPeriodStart)
        ),
        end: createTimestamp(formatDateToNativeDateParts(encounterPeriodEnd)),
      },
      serviceProvider: {
        reference: `${providerOrganizationUrl}/${organizationReference}`,
      },
    },
  };
};

export default createNphiesEncounter;
