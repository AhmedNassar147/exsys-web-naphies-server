/*
 *
 * Helpers: `createNphiesPatientData`.
 *
 */
import createNphiesBaseResource from "../base/createNphiesBaseResource.mjs";
import reverseDate from "../../nodeHelpers/reverseDate.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { PROFILE_PATIENT } = NPHIES_BASE_PROFILE_TYPES;
const { PATIENT } = NPHIES_RESOURCE_TYPES;
const { BASE_CODE_SYS_URL, BASE_TERMINOLOGY_CODE_SYS_URL, BASE_PROFILE_URL } =
  NPHIES_API_URLS;
const {
  MARITAL_STATUS,
  PATIENT_IDENTIFIER_TYPE,
  KAS_EXT_ADMIN_GENDER,
  KSA_ADMIN_GENDER,
} = NPHIES_BASE_CODE_TYPES;

const createNphiesPatientData = ({
  patientId,
  nationalId,
  nationalIdType,
  staffFirstName,
  staffFamilyName,
  staffPhone,
  patientGender,
  patientBirthdate,
  patientMaritalStatus,
  providerPatientUrl,
}) => {
  const staffNames = [staffFirstName || " ", staffFamilyName || " "];

  return {
    fullUrl: `${providerPatientUrl}/${patientId}`,
    resource: {
      ...createNphiesBaseResource({
        resourceType: PATIENT,
        profileType: PROFILE_PATIENT,
        uuid: patientId,
      }),
      identifier: [
        {
          system: "http://nphies.sa/identifier/iqama",
          value: nationalId,
          type: {
            coding: [
              {
                system: `${BASE_CODE_SYS_URL}/${PATIENT_IDENTIFIER_TYPE}`,
                code: nationalIdType,
              },
            ],
          },
        },
      ],
      active: true,
      name: [
        {
          given: staffNames,
          text: staffNames.join(" "),
          family: staffFamilyName || undefined,
          use: "official",
        },
      ],
      telecom: [
        {
          system: "phone",
          value: staffPhone,
        },
      ],
      ...(patientGender
        ? {
            gender: patientGender,
            _gender: {
              extension: [
                {
                  url: `${BASE_PROFILE_URL}/${KAS_EXT_ADMIN_GENDER}`,
                  valueCodeableConcept: {
                    coding: [
                      {
                        system: `${BASE_CODE_SYS_URL}/${KSA_ADMIN_GENDER}`,
                        code: patientGender,
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
    },
  };
};

export default createNphiesPatientData;
