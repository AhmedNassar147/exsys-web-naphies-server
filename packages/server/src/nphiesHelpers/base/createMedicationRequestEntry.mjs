/*
 *
 * Helper: `createMedicationRequestEntry`.
 *
 */
import {
  createUUID,
  formatDateToNativeDateParts,
  getCurrentDate,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_REQUEST_TYPES,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { MEDICATION_REQUEST } = NPHIES_REQUEST_TYPES;

const { BASE_CODE_SYS_URL } = NPHIES_API_URLS;
const { SCIENTIFIC_CODES } = NPHIES_BASE_CODE_TYPES;

const { PROFILE_MEDICATION_REQUEST } = NPHIES_BASE_PROFILE_TYPES;
const { MedicationRequest } = NPHIES_RESOURCE_TYPES;

const dateOptions = {
  subtractMonthBy: 1,
  returnResultAsTimeStamp: true,
  replaceWith: ["Z", "+03:00"],
};

const createMedicationRequestEntry = ({
  medicationRequestUrl,
  providerPatientUrl,
  medicationRequestId,
  patientId,
  providerDoctorUrl,
  primaryDoctorId,
  product,
}) => {
  const {
    // nphiesProductCodeType,
    // nphiesProductCode,
    // nphiesProductName,
    scientificCodes,
    dosageData,
  } = product;

  const { dateString: currentDate } = getCurrentDate(true);

  const identifierSystem = medicationRequestUrl.replace(
    MEDICATION_REQUEST,
    (s) => s.toLowerCase()
  );

  return {
    fullUrl: `${medicationRequestUrl}/${medicationRequestId}`,
    resource: {
      ...createNphiesBaseResource({
        resourceType: MedicationRequest,
        profileType: PROFILE_MEDICATION_REQUEST,
        uuid: medicationRequestId,
      }),
      identifier: [
        {
          system: identifierSystem,
          value: createUUID(),
        },
      ],
      status: "active",
      intent: "order",
      medicationCodeableConcept: {
        coding: [
          {
            system: `${BASE_CODE_SYS_URL}/${SCIENTIFIC_CODES}`,
            code: scientificCodes,
          },
        ],
      },
      subject: {
        reference: `${providerPatientUrl}/${patientId}`,
      },
      authoredOn: currentDate,
      requester: {
        reference: `${providerDoctorUrl}/${primaryDoctorId}`,
      },
      dosageInstruction: !isArrayHasData(dosageData)
        ? undefined
        : dosageData.map(
            ({
              sequence,
              text,
              patientInstruction,
              boundsPeriodStart,
              boundsPeriodEnd,
              duration,
              durationUnit,
              frequency,
              period,
              periodUnit,
              doseQuantity,
              doseCode,
              doseSystemUrl,
              routeCode,
              routeDisplay,
              routeUrl,
            }) => ({
              sequence,
              text,
              patientInstruction,
              timing: {
                repeat: {
                  boundsPeriod: {
                    start: formatDateToNativeDateParts(
                      boundsPeriodStart,
                      dateOptions
                    ),
                    end: formatDateToNativeDateParts(
                      boundsPeriodEnd,
                      dateOptions
                    ),
                  },
                  duration,
                  durationUnit,
                  frequency,
                  period,
                  periodUnit,
                },
              },
              doseAndRate: [
                {
                  doseQuantity: {
                    value: doseQuantity,
                    system: doseSystemUrl,
                    code: doseCode,
                  },
                },
              ],
              route: {
                coding: [
                  {
                    system: routeUrl,
                    code: routeCode,
                    display: routeDisplay,
                  },
                ],
              },
            })
          ),
    },
  };
};

export default createMedicationRequestEntry;
