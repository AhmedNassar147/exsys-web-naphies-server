/*
 *
 * Helpers: `createNphiesEncounter`.
 *
 */
import { formatDateToNativeDateParts } from "@exsys-web-server/helpers";
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { PROFILE_ENCOUNTER } = NPHIES_BASE_PROFILE_TYPES;
const {
  EXTENSION_SERVICE_EVENT_TYPE,
  CODE_SERVICE_EVENT_TYPE,
  EXTENSION_ADMISSION_SPECIALTY,
  PRACTICE_CODES,
  ADMISSION_SOURCE,
  EXTENSION_EMERGENCY_ARRIVAL_CODE,
  EMERGENCY_ARRIVAL_CODE,
  EXTENSION_EMERGENCY_SERVICE_START,
  EXTENSION_EMERGENCY_DISPOSITION,
  EMERGENCY_DISPOSITION,
  EXTENSION_TRIAGE_CATEGORY,
  TRIAGE_CATEGORY,
  EXTENSION_TRIAGE_DATE,
  EXTENSION_CAUSE_OF_DEATH,
  CAUSE_OF_DEATH,
  EXTENSION_DISCHARGE_SPECIALTY,
  EXTENSION_LENGTH_OF_STAY,
  ENCOUNTER_LENGTH_OF_STAY,
  EXTENSION_DISCHARGE_DISPOSITION,
} = NPHIES_BASE_CODE_TYPES;
const { ENCOUNTER } = NPHIES_RESOURCE_TYPES;
const { BASE_CODE_SYS_URL, BASE_PROFILE_URL, BASE_TERMINOLOGY_CODE_SYS_URL } =
  NPHIES_API_URLS;

const periodFormatOptions = {
  stringifyReturnedDate: true,
  use3Plus: true,
  subtractMonthBy: 1,
};

const createNphiesEncounter = ({
  organizationReference,
  providerOrganizationUrl,
  encounterUrl,
  requestId,
  encounterServiceEventType,
  encounterStatus,
  encounterClassCode,
  encounterClassDisplay,
  encounterServiceType,
  encounterPeriodStart,
  encounterPeriodEnd,
  providerPatientUrl,
  patientFileNo,
  encounterAdmissionSpecialtyCode,
  encounterAdmissionSpecialtyDisplay,
  encounterAdmitSourceCode,
  encounterAdmitSourceDisplay,
  encounterArrivalCode,
  encounterArrivalDisplay,
  encounterEmergencyServiceStartDate,
  encounterEmergencyDispositionCode,
  encounterEmergencyDispositionDisplay,
  encounterTriageCategoryCode,
  encounterTriageCategoryDisplay,
  encounterTriageDate,
  encounterCauseOfDeathCode,
  encounterCauseOfDeathDisplay,
  extensionDischargeSpecialtyCode,
  extensionDischargeSpecialtyDisplay,
  extensionIntendedLengthOfStayCode,
  extensionIntendedLengthOfStayDisplay,
  dischargeDispositionCode,
  dischargeDispositionDisplay,
}) => {
  const showHospitalizationSection = [
    extensionDischargeSpecialtyCode,
    extensionIntendedLengthOfStayCode,
    encounterAdmissionSpecialtyCode,
    encounterAdmitSourceCode,
    dischargeDispositionCode,
  ].some(Boolean);

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
        !!encounterArrivalCode && {
          url: `${BASE_PROFILE_URL}/${EXTENSION_EMERGENCY_ARRIVAL_CODE}`,
          valueCodeableConcept: {
            coding: [
              {
                system: `${BASE_CODE_SYS_URL}/${EMERGENCY_ARRIVAL_CODE}`,
                code: encounterArrivalCode,
                display: encounterArrivalDisplay,
              },
            ],
          },
        },
        !!encounterEmergencyServiceStartDate && {
          url: `${BASE_PROFILE_URL}/${EXTENSION_EMERGENCY_SERVICE_START}`,
          valueDateTime: formatDateToNativeDateParts(
            encounterEmergencyServiceStartDate,
            periodFormatOptions
          ),
        },
        !!encounterEmergencyDispositionCode && {
          url: `${BASE_PROFILE_URL}/${EXTENSION_EMERGENCY_DISPOSITION}`,
          valueCodeableConcept: {
            coding: [
              {
                system: `${BASE_CODE_SYS_URL}/${EMERGENCY_DISPOSITION}`,
                code: encounterEmergencyDispositionCode,
                display: encounterEmergencyDispositionDisplay,
              },
            ],
          },
        },
        !!encounterTriageCategoryCode && {
          url: `${BASE_PROFILE_URL}/${EXTENSION_TRIAGE_CATEGORY}`,
          valueCodeableConcept: {
            coding: [
              {
                system: `${BASE_CODE_SYS_URL}/${TRIAGE_CATEGORY}`,
                code: encounterTriageCategoryCode,
                display: encounterTriageCategoryDisplay,
              },
            ],
          },
        },
        !!encounterTriageDate && {
          url: `${BASE_PROFILE_URL}/${EXTENSION_TRIAGE_DATE}`,
          valueDateTime: formatDateToNativeDateParts(
            encounterTriageDate,
            periodFormatOptions
          ),
        },
        !!encounterServiceEventType && {
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
        !!encounterCauseOfDeathCode && {
          url: `${BASE_PROFILE_URL}/${EXTENSION_CAUSE_OF_DEATH}`,
          valueCodeableConcept: {
            coding: [
              {
                system: `${BASE_CODE_SYS_URL}/${CAUSE_OF_DEATH}`,
                code: encounterCauseOfDeathCode,
                display: encounterCauseOfDeathDisplay,
              },
            ],
          },
        },
      ].filter(Boolean),
      identifier: [
        {
          system: encounterUrl.replace(ENCOUNTER, ENCOUNTER.toLowerCase()),
          value: `${ENCOUNTER}${requestId}`,
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
        start: formatDateToNativeDateParts(
          encounterPeriodStart,
          periodFormatOptions
        ),
        end: formatDateToNativeDateParts(
          encounterPeriodEnd,
          periodFormatOptions
        ),
      },
      hospitalization: showHospitalizationSection
        ? {
            extension: [
              !!extensionDischargeSpecialtyCode && {
                url: `${BASE_PROFILE_URL}/${EXTENSION_DISCHARGE_SPECIALTY}`,
                valueCodeableConcept: {
                  coding: [
                    {
                      system: `${BASE_CODE_SYS_URL}/${PRACTICE_CODES}`,
                      code: extensionDischargeSpecialtyCode,
                      display: extensionDischargeSpecialtyDisplay,
                    },
                  ],
                },
              },
              !!extensionIntendedLengthOfStayCode && {
                url: `${BASE_PROFILE_URL}/${EXTENSION_LENGTH_OF_STAY}`,
                valueCodeableConcept: {
                  coding: [
                    {
                      system: `${BASE_CODE_SYS_URL}/${ENCOUNTER_LENGTH_OF_STAY}`,
                      code: extensionIntendedLengthOfStayCode,
                      display: extensionIntendedLengthOfStayDisplay,
                    },
                  ],
                },
              },
              !!encounterAdmissionSpecialtyCode && {
                url: `${BASE_PROFILE_URL}/${EXTENSION_ADMISSION_SPECIALTY}`,
                valueCodeableConcept: {
                  coding: [
                    {
                      system: `${BASE_CODE_SYS_URL}/${PRACTICE_CODES}`,
                      code: encounterAdmissionSpecialtyCode,
                      display: encounterAdmissionSpecialtyDisplay,
                    },
                  ],
                },
              },
            ].filter(Boolean),
            ...(!!encounterAdmitSourceCode
              ? {
                  admitSource: {
                    coding: [
                      {
                        system: `${BASE_CODE_SYS_URL}/${ADMISSION_SOURCE}`,
                        code: encounterAdmitSourceCode,
                        display: encounterAdmitSourceDisplay,
                      },
                    ],
                  },
                }
              : null),
            ...(!!dischargeDispositionCode
              ? {
                  dischargeDisposition: {
                    coding: [
                      {
                        system: `${BASE_CODE_SYS_URL}/${EXTENSION_DISCHARGE_DISPOSITION}`,
                        code: dischargeDispositionCode,
                        display: dischargeDispositionDisplay,
                      },
                    ],
                  },
                }
              : null),
          }
        : undefined,
      serviceProvider: {
        reference: `${providerOrganizationUrl}/${organizationReference}`,
      },
    },
  };
};

export default createNphiesEncounter;
