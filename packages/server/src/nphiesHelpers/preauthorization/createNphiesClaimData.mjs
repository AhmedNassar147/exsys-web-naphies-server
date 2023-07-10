/*
 *
 * Helpers: `createNphiesClaimData`.
 *
 */
import { isArrayHasData, reverseDate } from "@exsys-web-server/helpers";
import createBaseEntryRequestData from "../base/createBaseEntryRequestData.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_BASE_CODE_TYPES,
  NPHIES_API_URLS,
  SUPPORT_INFO_USING_UNITS,
  SUPPORT_INFO_KEY_NAMES,
} from "../../constants.mjs";

const {
  BASE_TERMINOLOGY_CODE_SYS_URL,
  BASE_CODE_SYS_URL,
  DIAG_ICD_URL,
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

const getProductNetValue = ({ unitPrice, extensionTax, quantity }) => {
  return +(((unitPrice || 0) + (extensionTax || 0)) * (quantity || 0)).toFixed(
    2
  );
};

const getSequences = (arrayData, ids, idPropName) => {
  if (!isArrayHasData(arrayData) || !isArrayHasData(ids)) {
    return undefined;
  }
  return arrayData
    .map(({ [idPropName]: id }, index) =>
      ids.includes(id) ? index + 1 : undefined
    )
    .filter(Boolean);
};

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
  diagnosisData,
  primaryDoctorSequence,
  primaryDoctorFocal,
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
    insuranceFocal: primaryDoctorFocal,
    insuranceSequence: primaryDoctorSequence,
    identifierUrl: `${siteUrl}/authorization`,
    resourceType: CLAIM,
    profileType,
  });

  const hasDiagnosisData = isArrayHasData(diagnosisData);
  const hasSupportingInfoData = isArrayHasData(supportingInfo);
  const hasProductsData = isArrayHasData(productsData);

  const totalValue = hasProductsData
    ? productsData.reduce(
        (acc, product) => +(acc + getProductNetValue(product)).toFixed(2),
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
            (
              { value, categoryCode, systemUrl, code, display, text, unit },
              index
            ) => {
              const isInfoCode = categoryCode === SUPPORT_INFO_KEY_NAMES.info;
              const isOnsetCode = categoryCode === SUPPORT_INFO_KEY_NAMES.onset;
              const isHospitalizedCode =
                categoryCode === SUPPORT_INFO_KEY_NAMES.hospitalized;
              const isAttachment =
                categoryCode === SUPPORT_INFO_KEY_NAMES.attachment;
              const isMissingTooth =
                categoryCode === SUPPORT_INFO_KEY_NAMES.missingtooth;
              const isEmploymentImpacted =
                categoryCode === SUPPORT_INFO_KEY_NAMES.employmentImpacted;
              const hasTimingPeriod =
                isHospitalizedCode || isEmploymentImpacted;

              const hasCodeSection = !!(systemUrl && code);

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
                code: hasCodeSection
                  ? {
                      coding: [
                        {
                          system: systemUrl,
                          code,
                          display,
                        },
                      ],
                      text,
                    }
                  : undefined,
                valueString: isInfoCode ? value : undefined,
                timingDate:
                  isOnsetCode || isMissingTooth
                    ? reverseDate(value)
                    : undefined,
                timingPeriod: hasTimingPeriod
                  ? {
                      start: reverseDate(value[0]),
                      end: reverseDate(value[1]),
                    }
                  : undefined,
                valueQuantity: !!unit
                  ? {
                      value: value,
                      system: systemUrl,
                      code: unit,
                    }
                  : undefined,
                valueAttachment: !!(isAttachment && value)
                  ? {
                      ...value,
                      data: value.data.replace(/.+base64,/, "/"),
                      creation: reverseDate(value.creation),
                    }
                  : undefined,
              };
            }
          )
        : undefined,
      diagnosis: hasDiagnosisData
        ? diagnosisData.map(
            ({ onAdmission, diagCode, diagType, diagDisplay }, index) => ({
              sequence: index + 1,
              onAdmission: ["y", "Y"].includes(onAdmission)
                ? {
                    coding: [
                      {
                        system: `${BASE_CODE_SYS_URL}/${DIAG_ON_ADMISSION}`,
                        code: onAdmission,
                        display: diagDisplay,
                      },
                    ],
                  }
                : undefined,
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
            })
          )
        : undefined,
      item: hasProductsData
        ? productsData.map(
            (
              {
                nphiesProductCode,
                nphiesProductCodeType,
                nphiesProductName,
                servicedDate,
                quantity,
                unitPrice,
                extensionTax,
                extensionPatientShare,
                extensionPackage,
                diagnosisIds,
                doctorsIds,
              },
              index
            ) => ({
              extension: [
                extensionTax
                  ? {
                      url: `${BASE_PROFILE_URL}/${EXTENSION_TAX}`,
                      valueMoney: {
                        value: extensionTax,
                        currency,
                      },
                    }
                  : undefined,
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
              ].filter(Boolean),
              sequence: index + 1,
              careTeamSequence: getSequences(doctorsData, doctorsIds, "id"),
              diagnosisSequence: getSequences(
                diagnosisData,
                diagnosisIds,
                "diagCode"
              ),
              informationSequence: hasSupportingInfoData
                ? supportingInfo.map((_, index) => index + 1)
                : undefined,
              productOrService: {
                coding: [
                  {
                    system: `${BASE_CODE_SYS_URL}/${nphiesProductCodeType}`,
                    code: nphiesProductCode,
                    display: nphiesProductName,
                  },
                ],
              },
              servicedDate: reverseDate(servicedDate),
              quantity: {
                value: quantity,
              },
              unitPrice: {
                value: unitPrice || 0,
                currency,
              },
              net: {
                value: getProductNetValue({
                  quantity,
                  unitPrice,
                  extensionTax,
                }),
                currency,
              },
            })
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
