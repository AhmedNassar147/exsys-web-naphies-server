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

const PREAUTH_PROFILE_TYPES = {
  institutional: PROFILE_INSTITUTIONAL_PREAUTH,
  vision: PROFILE_VISION_PREAUTH,
  oral: PROFILE_ORAL_PREAUTH,
  pharmacy: PROFILE_PHARMACY_PREAUTH,
  professional: PROFILE_PROFESSIONAL_PREAUTH,
};

const currency = "SAR";

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
        value: `EpisodeID-${episodeInvoiceNo}`,
      },
    },
  ].filter(Boolean);

const getSupportingInfoSequences = (supportingInfo, daysSupplyId) =>
  supportingInfo.reduce((acc, { categoryCode, value }, currentIndex) => {
    const isDaysSupply = categoryCode === SUPPORT_INFO_KEY_NAMES.days_supply;
    if (
      !isDaysSupply ||
      (isDaysSupply && !!daysSupplyId && daysSupplyId === value)
    ) {
      acc.push(currentIndex + 1);
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
  claim_subType,
  visionPrescriptionUrl,
  useVisionPrescriptionUrl,
  providerDoctorUrl,
  supportingInfo,
  doctorsData,
  hasDoctorsData,
  productsData,
  productsTotalNet,
  diagnosisData,
  primaryDoctorSequence,
  primaryDoctorFocal,
  episodeInvoiceNo,
  preauthRefs,
}) => {
  const profileType = PREAUTH_PROFILE_TYPES[message_event_type];

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
      ...(claim_subType
        ? {
            subType: {
              coding: [
                {
                  system: `${BASE_CODE_SYS_URL}/${CLAIM_SUBTYPE}`,
                  code: claim_subType,
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
              let _title = title || "";
              _title += ` ${contentType.replace("/", ".")}`;

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
                      title: _title,
                      creation: reverseDate(creation),
                      data: value,
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
              customerProductCode,
              customerProductName,
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
              net_price,
              patientInvoiceNo,
              tooth,
              factor,
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
                !!(episodeInvoiceNo || patientInvoiceNo) && {
                  url: `${BASE_PROFILE_URL}/${EXTENSION_PATIENT_INVOICE}`,
                  valueIdentifier: {
                    system: `${siteUrl}/patientInvoice`,
                    value: `Invc-${
                      patientInvoiceNo || episodeInvoiceNo
                    }/T_${Date.now()}`,
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
                  {
                    system: `${siteUrl}/${nphiesProductCodeType}`,
                    code: customerProductCode,
                    display: customerProductName || nphiesProductName,
                  },
                ],
              },
              servicedDate: reverseDate(servicedDate),
              // factor: (discount / unitprice) - 1
              quantity: {
                value: quantity,
              },
              unitPrice: {
                value: unitPrice || 0,
                currency,
              },
              factor,
              net: {
                value: net_price,
                currency,
              },
              ...(tooth
                ? {
                    bodySite: {
                      coding: [
                        {
                          system:
                            "http://nphies.sa/terminology/CodeSystem/fdi-oral-region",
                          code: tooth,
                        },
                      ],
                    },
                  }
                : null),
            })
          )
        : undefined,
      total: {
        value: productsTotalNet,
        currency,
      },
    },
  };
};

export default createNphiesClaimData;
