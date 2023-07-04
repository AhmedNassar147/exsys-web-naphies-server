/*
 *
 * Helpers: `createNphiesClaimData`.
 *
 */
import createBaseEntryRequestData from "../base/createBaseEntryRequestData.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_BASE_CODE_TYPES,
  NPHIES_API_URLS,
} from "../../constants.mjs";

const {
  BASE_TERMINOLOGY_CODE_SYS_URL,
  BASE_CODE_SYS_URL,
  DIAG_ICD_URL,
  LOINC_URL,
  BASE_PROFILE_URL,
} = NPHIES_API_URLS;
const {
  PROFILE_VISION_PREAUTH,
  PROFILE_INSTITUTIONAL_PREAUTH,
  PROFILE_ORAL_PREAUTH,
  PROFILE_PHARMACY_PREAUTH,
  PROFILE_PROFESSIONAL_PREAUTH,
} = NPHIES_BASE_PROFILE_TYPES;
const { CLAIM } = NPHIES_RESOURCE_TYPES;
const {
  CLAIM_TYPE,
  CLAIM_SUBTYPE,
  PAYEE_TYPE,
  CLAIM_CARE_TEAM_ROLE,
  PRACTICE_CODES,
  CLAIM_INFO_CATEGORY,
  DIAG_ON_ADMISSION,
  DIAG_TYPE,
  EXTENSION_TAX,
  EXTENSION_PATIENT_SHARE,
  EXTENSION_PACKAGE,
} = NPHIES_BASE_CODE_TYPES;

const PREAUTH_TYPES = {
  institutional: {
    profileType: PROFILE_INSTITUTIONAL_PREAUTH,
    subType: "ip",
  },
  vision: {
    profileType: PROFILE_VISION_PREAUTH,
    subType: "op",
  },
  oral: {
    profileType: PROFILE_ORAL_PREAUTH,
    subType: "op",
  },
  pharmacy: {
    profileType: PROFILE_PHARMACY_PREAUTH,
    subType: "op",
  },
  professional: {
    profileType: PROFILE_PROFESSIONAL_PREAUTH,
    subType: "op",
  },
};

const currency = "SAR";

const getProductNetValue = ({
  unitPrice,
  extensionTax,
  extensionPatientShare,
  quantity,
}) =>
  ((unitPrice || 0) + (extensionTax || 0) + (extensionPatientShare || 0)) *
  (quantity || 0);

const createNphiesClaimData = ({
  requestId,
  providerOrganization,
  payerOrganization,
  patientId,
  businessArrangement,
  providerPatientUrl,
  providerOrganizationUrl,
  providerCoverageUrl,
  providerFocusUrl,
  siteUrl,
  preauthType,
  visionPrescriptionUrl,
  useVisionPrescriptionUrl,
  providerDoctorUrl,
  supportingInfo,
  doctorsData,
  hasDoctorsData,
  productsData,
}) => {
  const { profileType, subType } = PREAUTH_TYPES[preauthType];

  const { fullUrl, resource } = createBaseEntryRequestData({
    requestId,
    providerOrganization,
    payerOrganization,
    patientId,
    businessArrangement,
    providerPatientUrl,
    providerOrganizationUrl,
    providerCoverageUrl,
    providerFocusUrl,
    insuranceFocal: hasDoctorsData ? true : undefined,
    insuranceSequence: hasDoctorsData ? 1 : undefined,
    identifierUrl: `${siteUrl}/authorization`,
    resourceType: CLAIM,
    profileType,
    diagnosisData,
  });

  const hasDiagnosisData = !!(
    Array.isArray(diagnosisData) && diagnosisData.length
  );

  const hasSupportingInfoData = !!(
    Array.isArray(supportingInfo) && supportingInfo.length
  );

  const hasProductsData = !!(
    Array.isArray(productsData) && productsData.length
  );

  const totalValue = hasProductsData
    ? productsData.reduce(
        (acc, { quantity, unitPrice, extensionTax, extensionPatientShare }) => {
          return (
            acc +
            getProductNetValue({
              quantity,
              unitPrice,
              extensionTax,
              extensionPatientShare,
            })
          );
        },
        0
      )
    : 0;

  return {
    fullUrl,
    resource: {
      ...resource,
      type: {
        coding: [
          {
            system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/${CLAIM_TYPE}`,
            code: preauthType,
          },
        ],
      },
      ...(subType
        ? {
            subType: {
              coding: [
                {
                  system: `${BASE_CODE_SYS_URL}/${CLAIM_SUBTYPE}`,
                  code: subType,
                },
              ],
            },
          }
        : null),
      use: "preauthorization",
      ...(useVisionPrescriptionUrl
        ? {
            prescription: {
              reference: `${visionPrescriptionUrl}/${requestId}`,
            },
          }
        : null),
      payee: {
        type: {
          coding: [
            {
              system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/${PAYEE_TYPE}`,
              code: "provider",
            },
          ],
        },
      },
      careTeam: hasDoctorsData
        ? doctorsData.map(({ id, roleCode, practiceCode }, index) => ({
            sequence: index + 1,
            provider: {
              reference: `${providerDoctorUrl}/${id}`,
            },
            role: {
              coding: [
                {
                  system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/${CLAIM_CARE_TEAM_ROLE}`,
                  code: roleCode,
                },
              ],
            },
            qualification: {
              coding: [
                {
                  system: `${BASE_CODE_SYS_URL}/${PRACTICE_CODES}`,
                  code: practiceCode,
                },
              ],
            },
          }))
        : undefined,
      supportingInfo: hasSupportingInfoData
        ? supportingInfo.map(
            ({ value, categoryCode, code, codeText }, index) => {
              const isOnsetCode = categoryCode === "onset";
              const isHospitalizedCode = categoryCode === "hospitalized";
              const isLabTest = categoryCode === "lab-test";

              const valueQtyCode = categoryCode.includes("height")
                ? "cm"
                : code.includes("weight")
                ? "kg"
                : isLabTest
                ? "pT"
                : "mm[Hg]";

              return {
                sequence: index + 1,
                category: {
                  coding: [
                    {
                      system: `${BASE_CODE_SYS_URL}/${CLAIM_INFO_CATEGORY}`,
                      code: categoryCode,
                    },
                  ],
                },
                code:
                  isLabTest || isOnsetCode
                    ? {
                        coding: [
                          {
                            system: isOnsetCode ? DIAG_ICD_URL : LOINC_URL,
                            code,
                          },
                        ],
                        text: codeText,
                      }
                    : undefined,
                timingDate: isOnsetCode ? value : undefined,
                timingPeriod: isHospitalizedCode
                  ? {
                      start: value[0],
                      end: value[1],
                    }
                  : undefined,
                valueQuantity:
                  isHospitalizedCode || isOnsetCode
                    ? undefined
                    : {
                        value: value,
                        system: "http://unitsofmeasure.org",
                        code: valueQtyCode,
                      },
              };
            }
          )
        : undefined,
      diagnosis: hasDiagnosisData
        ? diagnosisData.map(({ onAdmission, diagCode, diagType }, index) => ({
            sequence: index + 1,
            onAdmission: {
              coding: [
                {
                  system: `${BASE_CODE_SYS_URL}/${DIAG_ON_ADMISSION}`,
                  code: onAdmission ? "y" : "n",
                },
              ],
            },
            diagnosisCodeableConcept: {
              coding: [
                {
                  system: DIAG_ICD_URL,
                  code: diagCode,
                },
              ],
            },
            type: [
              {
                coding: [
                  {
                    system: `${BASE_CODE_SYS_URL}/${DIAG_TYPE}`,
                    code: diagType,
                  },
                ],
              },
            ],
          }))
        : undefined,
      item: hasProductsData
        ? hasProductsData.map(
            (
              {
                productCode,
                productCodeType,
                productName,
                servicedDate,
                quantity,
                unitPrice,
                extensionTax,
                extensionPatientShare,
                extensionPackage,
              },
              index
            ) => {
              return {
                extension: [
                  {
                    url: `${BASE_PROFILE_URL}/${EXTENSION_TAX}`,
                    valueMoney: {
                      value: extensionTax,
                      currency,
                    },
                  },
                  {
                    url: `${BASE_PROFILE_URL}/${EXTENSION_PATIENT_SHARE}`,
                    valueMoney: {
                      value: extensionPatientShare,
                      currency,
                    },
                  },
                  {
                    url: `${BASE_PROFILE_URL}/${EXTENSION_PACKAGE}`,
                    valueBoolean: extensionPackage === "Y",
                  },
                ],
                sequence: index + 1,
                careTeamSequence: [1],
                diagnosisSequence: [1],
                informationSequence: [1, 2, 3, 4, 5, 6, 7],
                productOrService: {
                  coding: [
                    {
                      system: `${BASE_CODE_SYS_URL}/${productCodeType}`,
                      code: productCode,
                      display: productName,
                    },
                  ],
                },
                servicedDate,
                quantity: {
                  value: quantity,
                },
                unitPrice: {
                  value: unitPrice,
                  currency,
                },
                net: {
                  value: getProductNetValue({
                    quantity,
                    unitPrice,
                    extensionTax,
                    extensionPatientShare,
                  }),
                  currency,
                },
              };
            }
          )
        : undefined,
      total: {
        value: totalValue,
        currency,
      },
    },
  };
};

export default createNphiesClaimData;
