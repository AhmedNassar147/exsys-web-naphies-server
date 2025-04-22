/*
 *
 * Helpers: `createNphiesClaimData`.
 *
 */
import { isArrayHasData, reverseDate } from "@exsys-web-server/helpers";
import createBaseEntryRequestData from "./createBaseEntryRequestData.mjs";
import removeInvisibleCharactersFromString from "../../helpers/removeInvisibleCharactersFromString.mjs";
import createNphiesAttachmentObject from "./createNphiesAttachmentObject.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_BASE_CODE_TYPES,
  NPHIES_API_URLS,
  SUPPORT_INFO_KEY_NAMES,
  USE_NEW_INVESTIGATION_AS_ATTACHMENT,
  INVESTIGATION_RESULT_CODE_FOR_ATTACHMENT,
  NPHIES_REQUEST_TYPES,
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
  PROFILE_PRESCRIBER_PREAUTH,
} = NPHIES_BASE_PROFILE_TYPES;

const { CLAIM } = NPHIES_RESOURCE_TYPES;
const { PRESCRIBER } = NPHIES_REQUEST_TYPES;

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
  EXTENSION_ONSET_CONDITION_CODE,
  EXTENSION_MEDICATION_REQUEST,
  EXTENSION_STRENGTH,
} = NPHIES_BASE_CODE_TYPES;

const PREAUTH_PROFILE_TYPES = {
  institutional: PROFILE_INSTITUTIONAL_PREAUTH,
  vision: PROFILE_VISION_PREAUTH,
  oral: PROFILE_ORAL_PREAUTH,
  pharmacy: PROFILE_PHARMACY_PREAUTH,
  professional: PROFILE_PROFESSIONAL_PREAUTH,
  [PRESCRIBER]: PROFILE_PRESCRIBER_PREAUTH,
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
  fileUrl,
}) => {
  const isChiefOfClomplaintCode =
    categoryCode === SUPPORT_INFO_KEY_NAMES.chief_complaint;

  if (isChiefOfClomplaintCode) {
    return {
      currentCategoryCode: categoryCode,
      codeSection: {
        text: text,
      },
    };
  }

  let __categoryCode = categoryCode;

  const hasCodeSection = !!(systemUrl && code);

  const IS_INFO_CATEGORY = categoryCode === SUPPORT_INFO_KEY_NAMES.info;
  const IS_IRA_CODE = code === INVESTIGATION_RESULT_CODE_FOR_ATTACHMENT;
  const IS_INFO_AND_IRA_CODE = IS_INFO_CATEGORY && IS_IRA_CODE;
  const currentCode = IS_INFO_AND_IRA_CODE ? "other" : code;

  if (IS_INFO_AND_IRA_CODE) {
    __categoryCode = investigation_result;
  }

  const codeSection = {
    coding: [
      {
        system: systemUrl,
        code: currentCode,
        display,
      },
    ],
    text: IS_INFO_AND_IRA_CODE ? value : text,
  };

  if (__categoryCode === attachment) {
    const isUsingNewAttachmentCode =
      USE_NEW_INVESTIGATION_AS_ATTACHMENT && IS_IRA_CODE;

    const currentCategoryCode = isUsingNewAttachmentCode
      ? investigation_result
      : __categoryCode;

    return {
      currentCategoryCode,
      codeSection: isUsingNewAttachmentCode ? codeSection : undefined,
      valueAttachment: createNphiesAttachmentObject({
        title,
        creation: creation || batchPeriodStart,
        contentType,
        value,
        fileUrl,
      }),
    };
  }

  return {
    currentCategoryCode: __categoryCode,
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
    const islabResult = categoryCode === SUPPORT_INFO_KEY_NAMES.lab_test;

    const isDaysSupplyOrLabTest = isDaysSupply || islabResult;

    if (
      !isDaysSupplyOrLabTest ||
      (isDaysSupplyOrLabTest && !!daysSupplyId && daysSupplyId === value)
    ) {
      acc.push(currentIndex + 1);
    }

    return acc;
  }, []);

const createNphiesClaimData = ({
  requestId,
  isPrescriberRequestData,
  medicationRequestUrl,
  medicationRequestIds,
  approvalPrescriptionId,
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
  relatedRelationshipCode,
  relatedSystemUrl,
  priority,
}) => {
  const profileType = isPrescriberRequestData
    ? PREAUTH_PROFILE_TYPES[PRESCRIBER]
    : PREAUTH_PROFILE_TYPES[message_event_type];

  const _profileType = isClaimRequest
    ? profileType.replace("priorauth", "claim")
    : profileType;

  let identifierUrlLastPart = isPrescriberRequestData
    ? "prescription"
    : !isClaimRequest
    ? "authorization"
    : referalIdentifier
    ? "authorization"
    : "claim";

  if (relatedParentClaimIdentifier && isClaimRequest) {
    identifierUrlLastPart = "claim";
  }

  // "https://Interop.motalabatech.ai"

  const useValue = isPrescriberRequestData
    ? "predetermination"
    : isClaimRequest
    ? "claim"
    : "preauthorization";

  const identifierUrl = `${siteUrl}/${identifierUrlLastPart}`;

  const relatedIdentifierUrl = relatedSystemUrl || identifierUrl;

  const extension = isPrescriberRequestData
    ? undefined
    : createAuthorizationExtensions({
        siteUrl,
        extensionPriorauthId,
        offlineRequestDate,
        episodeInvoiceNo,
        batchPeriodStart,
        batchPeriodEnd,
        isTransfer,
        batchAccountingPeriod,
        encounterUrl,
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
    priority,
  });

  const hasDiagnosisData = isArrayHasData(diagnosisData);
  const hasSupportingInfoData = isArrayHasData(supportingInfo);
  const hasProductsData = isArrayHasData(productsData);

  let relatedClaimIdentifier = relatedParentClaimIdentifier;

  if (!relatedSystemUrl && relatedClaimIdentifier) {
    relatedClaimIdentifier = `req_${relatedParentClaimIdentifier}`;
  }

  return {
    fullUrl,
    resource: {
      ...resource,
      ...(relatedClaimIdentifier
        ? {
            related: [
              {
                claim: {
                  identifier: {
                    system: relatedIdentifierUrl,
                    value: relatedClaimIdentifier,
                  },
                },
                relationship: {
                  coding: [
                    {
                      system: `${BASE_CODE_SYS_URL}/${RELATED_CLAIM_RELATION}`,
                      code: relatedRelationshipCode || "prior",
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
      prescription: !!(approvalPrescriptionId || useVisionPrescriptionUrl)
        ? {
            reference: useVisionPrescriptionUrl
              ? `${visionPrescriptionUrl}/${requestId}`
              : undefined,
            display: approvalPrescriptionId || undefined,
          }
        : undefined,
      payee: isPrescriberRequestData
        ? undefined
        : {
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
                codingSystemUrl,
                code,
                display,
                text,
                unit,
                contentType,
                title,
                creation,
                periodStart,
                periodEnd,
                absenceReasonCode,
                absenceReasonUrl,
                fileUrl,
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

              const isLabTestCode =
                categoryCode === SUPPORT_INFO_KEY_NAMES.lab_test;

              const hasTimingPeriod =
                isHospitalizedCode || isEmploymentImpacted || isLabTestCode;

              const hasAbsenceReason = !!(
                absenceReasonCode && absenceReasonUrl
              );

              const { currentCategoryCode, codeSection, valueAttachment } =
                buildAttachmentSupportInfoWithCodeSection({
                  categoryCode,
                  code,
                  title,
                  contentType,
                  value,
                  creation,
                  batchPeriodStart,
                  systemUrl: codingSystemUrl || systemUrl,
                  display,
                  text,
                  fileUrl,
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
                ...(hasAbsenceReason
                  ? {
                      reason: {
                        coding: [
                          {
                            system: absenceReasonUrl,
                            code: absenceReasonCode,
                          },
                        ],
                      },
                    }
                  : null),
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
                valueQuantity:
                  !hasAbsenceReason && !!unit
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
            (
              {
                onAdmission,
                diagCode,
                diagType,
                diagDisplay,
                onSetExtensionCode,
              },
              index
            ) => ({
              ...(!!onSetExtensionCode
                ? {
                    extension: [
                      {
                        url: `${BASE_PROFILE_URL}/${EXTENSION_ONSET_CONDITION_CODE}`,
                        valueCodeableConcept: {
                          coding: [
                            {
                              system: `${BASE_CODE_SYS_URL}/${EXTENSION_ONSET_CONDITION_CODE.replace(
                                "extension-",
                                ""
                              )}`,
                              code: onSetExtensionCode,
                            },
                          ],
                        },
                      },
                    ],
                  }
                : null),
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
                    display: removeInvisibleCharactersFromString(
                      diagDisplay,
                      true
                    ),
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
            (
              {
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
                extensionPayerShare,
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
                medicationStrength,
              },
              index
            ) => {
              const IS_MOH = nphiesProductCodeType === "moh-category";

              const hasSecondProductSection =
                !isPrescriberRequestData && !IS_MOH;

              const productDisplay = isPrescriberRequestData
                ? undefined
                : removeInvisibleCharactersFromString(nphiesProductName, true);

              const service_date = servicedDate
                ? reverseDate(servicedDate)
                : undefined;

              const dateFieldName = IS_MOH ? "servicedPeriod" : "servicedDate";

              return {
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
                    url: `${BASE_PROFILE_URL}/${EXTENSION_PACKAGE}`,
                    valueBoolean: extensionPackage === "Y",
                  },
                  !!extensionPayerShare && {
                    url: "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-payer-share",
                    valueMoney: {
                      value: extensionPayerShare,
                      currency: "SAR",
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
                  ...(isPrescriberRequestData
                    ? [
                        {
                          url: `${BASE_PROFILE_URL}/${EXTENSION_MEDICATION_REQUEST}`,
                          valueReference: {
                            reference: `${medicationRequestUrl}/${medicationRequestIds[index]}`,
                          },
                        },
                        {
                          url: `${BASE_PROFILE_URL}/${EXTENSION_STRENGTH}`,
                          valueString: medicationStrength,
                        },
                      ]
                    : [
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
                      ]),
                ].filter(Boolean),
                productOrService: {
                  coding: [
                    {
                      system: isPrescriberRequestData
                        ? `${BASE_CODE_SYS_URL}/${SCIENTIFIC_CODES}`
                        : `${BASE_CODE_SYS_URL}/${nphiesProductCodeType}`,
                      code: isPrescriberRequestData
                        ? scientificCodes
                        : nphiesProductCode,
                      display: productDisplay,
                    },
                    hasSecondProductSection && {
                      system: `${siteUrl}/${nphiesProductCodeType}`,
                      code: customerProductCode || nphiesProductCode,
                      display: removeInvisibleCharactersFromString(
                        customerProductName || nphiesProductName,
                        true
                      ),
                    },
                  ].filter(Boolean),

                  text: IS_MOH ? productDisplay : undefined,
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
                ...(!isPrescriberRequestData
                  ? {
                      [dateFieldName]: IS_MOH
                        ? {
                            start: service_date,
                            end: service_date,
                          }
                        : service_date,
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
                    }
                  : null),
              };
            }
          )
        : undefined,
      total: isPrescriberRequestData
        ? undefined
        : {
            value: productsTotalNet,
            currency,
          },
    },
  };
};

export default createNphiesClaimData;
