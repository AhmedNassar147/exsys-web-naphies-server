/*
 *
 * Helpers: `createNphiesClaimData`.
 *
 */
import {
  isArrayHasData,
  reverseDate,
  replaceUnwantedCharactersFromString,
  // createTimestamp,
} from "@exsys-web-server/helpers";
import createBaseEntryRequestData from "./createBaseEntryRequestData.mjs";
import removeInvisibleCharactersFromString from "../../helpers/removeInvisibleCharactersFromString.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_BASE_CODE_TYPES,
  NPHIES_API_URLS,
  SUPPORT_INFO_KEY_NAMES,
  USE_NEW_INVESTIGATION_AS_ATTACHMENT,
  INVESTIGATION_RESULT_CODE_FOR_ATTACHMENT,
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
  EXT_PERIOD_START,
  EXT_ACCOUNT_PERIOD,
  EXTENSION_TRANSFER,
  EXTENSION_AUTH_ONLINE_RESPONSE,
  RELATED_CLAIM_RELATION,
  EXTENSION_PRESCRIBED_MEDS,
  SCIENTIFIC_CODES,
  EXTENSION_MEDS_SELECTION_REASON,
  SELECTION_REASON,
  EXTENSION_PHARM_SUBSTITUTE,
  PHARM_SUBSTITUTE,
  EXTENSION_MATERNITY,
  EXTENSION_ENCOUNTER,
} = NPHIES_BASE_CODE_TYPES;

const PREAUTH_PROFILE_TYPES = {
  institutional: PROFILE_INSTITUTIONAL_PREAUTH,
  vision: PROFILE_VISION_PREAUTH,
  oral: PROFILE_ORAL_PREAUTH,
  pharmacy: PROFILE_PHARMACY_PREAUTH,
  professional: PROFILE_PROFESSIONAL_PREAUTH,
};

const { investigation_result, attachment } = SUPPORT_INFO_KEY_NAMES;

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

const buildAttachmentSupportInfoWithCodeSection = ({
  categoryCode,
  code,
  title,
  contentType,
  creation,
  batchPeriodStart,
  value,
  systemUrl,
  display,
  text,
}) => {
  const hasCodeSection = !!(systemUrl && code);

  const codeSection = {
    coding: [
      {
        system: systemUrl,
        code,
        display,
      },
    ],
    text,
  };

  if (categoryCode === attachment) {
    let _title = title || "";

    const isUsingNewAttachmentCode =
      USE_NEW_INVESTIGATION_AS_ATTACHMENT &&
      code === INVESTIGATION_RESULT_CODE_FOR_ATTACHMENT;

    const currentCategoryCode = isUsingNewAttachmentCode
      ? investigation_result
      : categoryCode;

    if (contentType) {
      _title += ` ${contentType.replace("/", ".")}`;
    }

    return {
      currentCategoryCode,
      codeSection: isUsingNewAttachmentCode ? codeSection : undefined,
      valueAttachment: {
        contentType,
        title: removeInvisibleCharactersFromString(_title),
        creation: reverseDate(creation || batchPeriodStart),
        data: value,
      },
    };
  }

  return {
    currentCategoryCode: categoryCode,
    codeSection: hasCodeSection ? codeSection : undefined,
  };
};

const createAuthorizationExtensions = ({
  siteUrl,
  offlineRequestDate,
  episodeInvoiceNo,
  batchPeriodStart,
  batchAccountingPeriod,
  batchPeriodEnd,
  extensionPriorauthId,
  isTransfer,
  encounterUrl,
}) => {
  const extension = [
    !!offlineRequestDate && {
      url: `${BASE_PROFILE_URL}/${EXTENSION_AUTH_OFFLINE_DATE}`,
      valueDateTime: reverseDate(offlineRequestDate),
    },
    !!extensionPriorauthId && {
      url: `${BASE_PROFILE_URL}/${EXTENSION_AUTH_ONLINE_RESPONSE}`,
      valueReference: {
        identifier: {
          system: `${siteUrl}/authorizationresponse`,
          value: `resp_${extensionPriorauthId}`,
        },
      },
    },
    !!episodeInvoiceNo && {
      url: `${BASE_PROFILE_URL}/${EXTENSION_EPISODE}`,
      valueIdentifier: {
        system: `${siteUrl}/episode`,
        value: `EpisodeID-${episodeInvoiceNo}`,
      },
    },
    !!encounterUrl && {
      url: `${BASE_PROFILE_URL}/${EXTENSION_ENCOUNTER}`,
      valueReference: {
        reference: encounterUrl,
      },
    },
    !!(batchPeriodStart && batchPeriodEnd) && {
      url: `${BASE_PROFILE_URL}/${EXT_PERIOD_START}`,
      valuePeriod: {
        start: batchPeriodStart,
        end: batchPeriodEnd,
      },
    },
    !!batchAccountingPeriod && {
      url: `${BASE_PROFILE_URL}/${EXT_ACCOUNT_PERIOD}`,
      valueDate: batchAccountingPeriod,
    },
    !!isTransfer && {
      url: `${BASE_PROFILE_URL}/${EXTENSION_TRANSFER}`,
      valueBoolean: true,
    },
  ].filter(Boolean);

  return extension.length ? extension : undefined;
};

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
  batchPeriodStart,
  batchPeriodEnd,
  batchAccountingPeriod,
  offlineRequestDate,
  referalName,
  referalIdentifier,
  extensionPriorauthId,
  relatedParentClaimIdentifier,
  isTransfer,
  billablePeriodStartDate,
  billablePeriodEndDate,
  accidentDate,
  accidentCode,
  encounterUrl,
}) => {
  const profileType = PREAUTH_PROFILE_TYPES[message_event_type];

  const _profileType = isClaimRequest
    ? profileType.replace("priorauth", "claim")
    : profileType;

  const identifierUrl = `${siteUrl}/${
    !isClaimRequest
      ? "authorization"
      : referalIdentifier
      ? "authorization"
      : "claim"
  }`;

  const extension = createAuthorizationExtensions({
    siteUrl,
    extensionPriorauthId,
    offlineRequestDate,
    episodeInvoiceNo,
    batchPeriodStart,
    batchPeriodEnd,
    isTransfer,
    batchAccountingPeriod,
    encounterUrl: encounterUrl ? `${encounterUrl}/${requestId}` : undefined,
  });

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
    extension,
  });

  const hasDiagnosisData = isArrayHasData(diagnosisData);
  const hasSupportingInfoData = isArrayHasData(supportingInfo);
  const hasProductsData = isArrayHasData(productsData);

  const useValue = isClaimRequest ? "claim" : "preauthorization";

  return {
    fullUrl,
    resource: {
      ...resource,
      ...(relatedParentClaimIdentifier
        ? {
            related: [
              {
                claim: {
                  identifier: {
                    system: identifierUrl,
                    value: `req_${relatedParentClaimIdentifier}`,
                  },
                },
                relationship: {
                  coding: [
                    {
                      system: `${BASE_CODE_SYS_URL}/${RELATED_CLAIM_RELATION}`,
                      code: "prior",
                    },
                  ],
                },
              },
            ],
          }
        : null),
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
      ...(!!(billablePeriodStartDate && billablePeriodEndDate)
        ? {
            billablePeriod: {
              start: billablePeriodStartDate,
              end: billablePeriodEndDate,
            },
          }
        : null),
      ...(referalName
        ? {
            referral: {
              display: referalName,
            },
          }
        : null),
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
              const isInfoCode = [
                SUPPORT_INFO_KEY_NAMES.info,
                SUPPORT_INFO_KEY_NAMES.patient_history,
                SUPPORT_INFO_KEY_NAMES.treatment_plan,
                SUPPORT_INFO_KEY_NAMES.physical_examination,
                SUPPORT_INFO_KEY_NAMES.history_of_present_illness,
              ].includes(categoryCode);

              const isOnsetCode = categoryCode === SUPPORT_INFO_KEY_NAMES.onset;

              const isHospitalizedCode =
                categoryCode === SUPPORT_INFO_KEY_NAMES.hospitalized;

              const isMissingTooth =
                categoryCode === SUPPORT_INFO_KEY_NAMES.missingtooth;

              const isEmploymentImpacted =
                categoryCode === SUPPORT_INFO_KEY_NAMES.employmentImpacted;

              const hasTimingPeriod =
                isHospitalizedCode || isEmploymentImpacted;

              const { currentCategoryCode, codeSection, valueAttachment } =
                buildAttachmentSupportInfoWithCodeSection({
                  categoryCode,
                  code,
                  title,
                  contentType,
                  value,
                  creation,
                  batchPeriodStart,
                  systemUrl,
                  display,
                  text,
                });

              return {
                sequence: index + 1,
                category: {
                  coding: [
                    {
                      system: `${BASE_CODE_SYS_URL}/${CLAIM_INFO_CATEGORY}`,
                      code: currentCategoryCode,
                    },
                  ],
                },
                code: codeSection,
                valueAttachment,
                valueString: isInfoCode
                  ? removeInvisibleCharactersFromString(value)
                  : undefined,
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
      ...(!!(accidentDate && accidentCode)
        ? {
            accident: {
              date: reverseDate(accidentDate),
              type: {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    code: accidentCode,
                  },
                ],
              },
            },
          }
        : null),

      item: hasProductsData
        ? productsData.map(
            ({
              nphiesProductCode,
              nphiesProductCodeType,
              nphiesProductName,
              customerProductCode,
              customerProductName,
              scientificCodes,
              scientificCodesName,
              pharmacistSelectionReason,
              pharmacistSubstitute,
              isMaternity,
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
                {
                  url: `${BASE_PROFILE_URL}/${EXTENSION_TAX}`,
                  valueMoney: {
                    value: extensionTax || 0,
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
                !!scientificCodes && {
                  url: `${BASE_PROFILE_URL}/${EXTENSION_PRESCRIBED_MEDS}`,
                  valueCodeableConcept: {
                    coding: [
                      {
                        system: `${BASE_CODE_SYS_URL}/${SCIENTIFIC_CODES}`,
                        code: scientificCodes,
                        display: scientificCodesName,
                      },
                    ],
                  },
                },
                !!pharmacistSelectionReason && {
                  url: `${BASE_PROFILE_URL}/${EXTENSION_MEDS_SELECTION_REASON}`,
                  valueCodeableConcept: {
                    coding: [
                      {
                        system: `${BASE_CODE_SYS_URL}/${SELECTION_REASON}`,
                        code: pharmacistSelectionReason,
                        display: pharmacistSelectionReason,
                      },
                    ],
                  },
                },
                !!pharmacistSubstitute && {
                  url: `${BASE_PROFILE_URL}/${EXTENSION_PHARM_SUBSTITUTE}`,
                  valueCodeableConcept: {
                    coding: [
                      {
                        system: `${BASE_CODE_SYS_URL}/${PHARM_SUBSTITUTE}`,
                        code: pharmacistSubstitute,
                      },
                    ],
                  },
                },
                {
                  url: `${BASE_PROFILE_URL}/${EXTENSION_MATERNITY}`,
                  valueBoolean: isMaternity === "Y" ? true : false,
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
                    code: customerProductCode || nphiesProductCode,
                    display: replaceUnwantedCharactersFromString(
                      customerProductName || nphiesProductName
                    ),
                  },
                ].filter(Boolean),
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
