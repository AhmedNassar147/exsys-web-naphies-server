/*
 *
 * Helpers: `createNphiesDoctorOrPatientData`.
 *
 */
import { capitalizeFirstLetter, reverseDate } from "@exsys-web-server/helpers";
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { PROFILE_PATIENT, PROFILE_PRACTITIONER } = NPHIES_BASE_PROFILE_TYPES;
const { PATIENT, PRACTITIONER } = NPHIES_RESOURCE_TYPES;
const {
  BASE_CODE_SYS_URL,
  BASE_TERMINOLOGY_CODE_SYS_URL,
  BASE_PROFILE_URL,
  IQAMA_URL,
  NATIONAL_ID_URL,
  PASSPORT_NO_URL,
  // VISA_NO_URL,
  BORDER_NO_URL,
  PRACTITIONER_URL,
} = NPHIES_API_URLS;
const { MARITAL_STATUS, KAS_EXT_ADMIN_GENDER, KSA_ADMIN_GENDER } =
  NPHIES_BASE_CODE_TYPES;

const passportData = {
  code: "PPN",
  display: "passportnumber",
  system: PASSPORT_NO_URL,
};

const patientIdentifierData = {
  1: {
    code: "NI",
    display: "nationalid",
    system: NATIONAL_ID_URL,
  },
  2: {
    code: "PRC",
    display: "iqama",
    system: IQAMA_URL,
  },
  3: passportData,
};

const createNphiesDoctorOrPatientData = ({
  patientOrDoctorId,
  identifierId,
  identifierIdType,
  firstName,
  secondName,
  thirdName,
  familyName,
  staffPhone,
  gender,
  patientBirthdate,
  patientMaritalStatus,
  providerDoctorOrPatientUrl,
  isPatient = true,
}) => {
  const staffNames = [firstName, secondName, thirdName, familyName].filter(
    Boolean
  );

  const [first] = identifierId.split("");
  const { code, display, system } =
    patientIdentifierData[first] || passportData;

  if (!identifierId) {
    console.error("identifierId not found in createNphiesDoctorOrPatientData");
  }

  return {
    fullUrl: `${providerDoctorOrPatientUrl}/${patientOrDoctorId}`,
    resource: {
      ...createNphiesBaseResource({
        resourceType: isPatient ? PATIENT : PRACTITIONER,
        profileType: isPatient ? PROFILE_PATIENT : PROFILE_PRACTITIONER,
        uuid: patientOrDoctorId,
      }),
      identifier: [
        {
          type: {
            coding: [
              {
                system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/v2-0203`,
                code: identifierIdType || (isPatient ? code : "MD"),
                display: isPatient ? display : undefined,
              },
            ],
          },
          system: isPatient ? system : PRACTITIONER_URL,
          value: identifierId,
        },
      ],
      active: true,
      name: [
        {
          given: staffNames,
          text: staffNames.join(" "),
          family: familyName || undefined,
          use: "official",
        },
      ],
      ...(isPatient
        ? {
            ...(staffPhone
              ? {
                  telecom: [
                    {
                      system: "phone",
                      value: staffPhone,
                    },
                  ],
                }
              : null),
            ...(gender
              ? {
                  gender: gender,
                  _gender: {
                    extension: [
                      {
                        url: `${BASE_PROFILE_URL}/${KAS_EXT_ADMIN_GENDER}`,
                        valueCodeableConcept: {
                          coding: [
                            {
                              system: `${BASE_CODE_SYS_URL}/${KSA_ADMIN_GENDER}`,
                              code: gender,
                              display: capitalizeFirstLetter(gender),
                            },
                          ],
                        },
                      },
                    ],
                  },
                }
              : null),
            birthDate: reverseDate(patientBirthdate),
            ...(patientMaritalStatus
              ? {
                  maritalStatus: {
                    coding: [
                      {
                        system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/${MARITAL_STATUS}`,
                        code: patientMaritalStatus,
                      },
                    ],
                  },
                }
              : null),
          }
        : null),
    },
  };
};

export default createNphiesDoctorOrPatientData;
