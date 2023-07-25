/*
 *
 * Helpers: `createNphiesClaimData`.
 *
 */
import {
  isArrayHasData,
  reverseDate,
  createTimestamp,
} from "@exsys-web-server/helpers";
import createBaseEntryRequestData from "./createBaseEntryRequestData.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_BASE_CODE_TYPES,
  NPHIES_API_URLS,
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
  EXTENSION_PATIENT_INVOICE,
  EXTENSION_AUTH_OFFLINE_DATE,
  EXTENSION_EPISODE,
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

const getProductNetValue = ({ unitPrice, extensionTax, quantity }) =>
  +((unitPrice || 0) * (quantity || 0) + (extensionTax || 0)).toFixed(2);

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

const createAuthorizationExtensions = ({
  siteUrl,
  episodeInvoiceNo,
  preauthRefs,
}) =>
  [
    isArrayHasData(preauthRefs) && {
      url: `${BASE_PROFILE_URL}/${EXTENSION_AUTH_OFFLINE_DATE}`,
      valueDateTime: createTimestamp(),
    },
    {
      url: `${BASE_PROFILE_URL}/${EXTENSION_EPISODE}`,
      valueIdentifier: {
        system: `${siteUrl}/episode`,
        value: episodeInvoiceNo,
        // value: "SGH_EpisodeID_2314596",
      },
    },
  ].filter(Boolean);

const getSupportingInfoSequences = (supportingInfo, daysSupplyId) =>
  supportingInfo.reduce((acc, { categoryCode, value }, currentIndex) => {
    const isDaysSupply = categoryCode === "days-supply";
    if (
      !isDaysSupply ||
      (isDaysSupply && !!daysSupplyId && daysSupplyId === value)
    ) {
      acc.push(currentIndex + 1);
      return acc;
    }

    return acc;
  }, []);

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
  isClaimRequest,
  message_event_type,
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
  episodeInvoiceNo,
  preauthRefs,
}) => {
  const { profileType, subType } = PREAUTH_TYPES[message_event_type];

  const _profileType = isClaimRequest
    ? profileType.replace("priorauth", "claim")
    : profileType;

  const identifierUrl = `${siteUrl}/${
    isClaimRequest ? "claim" : "authorization"
  }`;

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
    insurancePreauthRefs: preauthRefs,
    identifierUrl,
    resourceType: CLAIM,
    profileType: _profileType,
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

  const useValue = isClaimRequest ? "claim" : "preauthorization";

  return {
    fullUrl,
    resource: {
      ...resource,
      extension: isClaimRequest
        ? createAuthorizationExtensions({
            siteUrl,
            episodeInvoiceNo,
            preauthRefs,
          })
        : undefined,
      type: {
        coding: [
          {
            system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/${CLAIM_TYPE}`,
            code: message_event_type,
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
      use: useValue,
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
              {
                value,
                categoryCode,
                systemUrl,
                code,
                display,
                text,
                unit,
                contentType,
                title,
                creation,
                periodStart,
                periodEnd,
              },
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
                code:
                  hasCodeSection && !isAttachment
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
                      start: reverseDate(periodStart),
                      end: reverseDate(periodEnd),
                    }
                  : undefined,
                valueQuantity: !!unit
                  ? {
                      value: value,
                      system: systemUrl,
                      code: unit,
                    }
                  : undefined,
                valueAttachment: !!isAttachment
                  ? {
                      contentType,
                      data: value,
                      title,
                      creation: reverseDate(creation),
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
                      },
                    ],
                  }
                : undefined,
              diagnosisCodeableConcept: {
                coding: [
                  {
                    system: DIAG_ICD_URL,
                    code: diagCode,
                    display: diagDisplay,
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
            ({
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
              sequence,
              days_supply_id,
            }) => ({
              sequence,
              careTeamSequence: getSequences(doctorsData, doctorsIds, "id"),
              diagnosisSequence: getSequences(
                diagnosisData,
                diagnosisIds,
                "diagCode"
              ),

              informationSequence: hasSupportingInfoData
                ? getSupportingInfoSequences(supportingInfo, days_supply_id)
                : undefined,
              extension: [
                !!extensionTax && {
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
                !!episodeInvoiceNo && {
                  url: `${BASE_PROFILE_URL}/${EXTENSION_PATIENT_INVOICE}`,
                  valueIdentifier: {
                    system: `${siteUrl}/patientInvoice`,
                    value: episodeInvoiceNo,
                  },
                },
                {
                  url: `${BASE_PROFILE_URL}/${EXTENSION_PACKAGE}`,
                  valueBoolean: extensionPackage === "Y",
                },
              ].filter(Boolean),
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
