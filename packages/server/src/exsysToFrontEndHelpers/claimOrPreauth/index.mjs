/*
 *
 * Helper: `extractPreauthOrClaimDataSentToNphies`.
 *
 */
import {
  getLastPartOfUrl,
  isArrayHasData,
  // readJsonFile,
  // writeResultFile,
  // findRootYarnWorkSpaces,
} from "@exsys-web-server/helpers";
import { NPHIES_BASE_CODE_TYPES } from "../../constants.mjs";
import mapEntriesAndExtractNeededData from "../../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractIdentifierData from "../../nphiesHelpers/extraction/extractIdentifierData.mjs";
import extractMessageHeaderData from "../../nphiesHelpers/extraction/extractMessageHeaderData.mjs";
import formatNphiesResponseIssue from "../../nphiesHelpers/base/formatNphiesResponseIssue.mjs";
import getValueFromObject from "../../nphiesHelpers/extraction/getValueFromObject.mjs";
import extractPatientData from "../base/extractPatientData.mjs";
import extractOrganizationData from "../base/extractOrganizationData.mjs";
import extractNphiesSentDataErrors from "./extractNphiesSentDataErrors.mjs";
import extractCoverageRelationship from "../../nphiesHelpers/extraction/extractCoverageRelationship.mjs";
import extractCancellationData from "./extractCancellationData.mjs";
import extractPollData from "./extractPollData.mjs";
import createProductsData from "./createProductsData.mjs";

const {
  EXTENSION_AUTH_OFFLINE_DATE,
  EXTENSION_AUTH_ONLINE_RESPONSE,
  EXTENSION_EPISODE,
  EXT_PERIOD_START,
  EXT_ACCOUNT_PERIOD,
  EXTENSION_TRANSFER,
} = NPHIES_BASE_CODE_TYPES;

const getExtensionData = (extension) => {
  if (isArrayHasData(extension)) {
    return extension.reduce(
      (
        acc,
        {
          url,
          valueDateTime,
          valueReference,
          valueIdentifier,
          valuePeriod,
          valueBoolean,
          valueDate,
        }
      ) => {
        if (url.includes(EXTENSION_AUTH_OFFLINE_DATE)) {
          acc.offlineRequestDate = valueDateTime;
        }

        if (url.includes(EXTENSION_AUTH_ONLINE_RESPONSE)) {
          const { identifier } = valueReference;
          acc.extensionPriorauthId = getValueFromObject(identifier);
        }

        if (url.includes(EXTENSION_EPISODE)) {
          const { value } = valueIdentifier;
          acc.extensionEpisodeNo = value;
        }

        if (url.includes(EXT_PERIOD_START)) {
          const { start, end } = valuePeriod;
          acc.extensionBatchPeriod = [start, end].join(" ~ ");
        }

        if (url.includes(EXT_ACCOUNT_PERIOD)) {
          acc.extensionAccountPeriod = valueDate;
        }

        if (url.includes(EXTENSION_TRANSFER)) {
          acc.extensionIsTransfer = valueBoolean;
        }

        return acc;
      },
      {}
    );
  }

  return null;
};

const getIdentifierUrlType = (identifier) => {
  const [, system] = extractIdentifierData(identifier);
  const type = getLastPartOfUrl(system);
  return type || undefined;
};

const getMemberId = (identifier) => {
  const [value] = extractIdentifierData(identifier);
  return value;
};

const createRequestRelatedData = (related) => {
  if (isArrayHasData(related)) {
    const [{ claim }] = related;
    const { identifier } = claim;
    const [value] = extractIdentifierData(identifier);
    return {
      claimRelatedIdentifier: (value || "").replace("req_", ""),
    };
  }

  return null;
};

const getSentPreAuthRef = (insurance) => {
  if (isArrayHasData(insurance)) {
    return insurance
      .reduce((acc, { preAuthRef }) => acc.concat(preAuthRef), [])
      .filter(Boolean)
      .join(" , ");
  }

  return "";
};

const extractionFunctionsMap = {
  MessageHeader: extractMessageHeaderData(),
  Claim: ({
    resource: {
      supportingInfo,
      diagnosis,
      item,
      total,
      created,
      priority,
      subType,
      extension,
      referral,
      identifier,
      related,
      careTeam,
      insurance,
    },
  }) => ({
    supportingInfo,
    diagnosis,
    productsSentToNphies: item,
    productsTotalNet: getValueFromObject(total),
    created,
    sentPreAuthRef: getSentPreAuthRef(insurance),
    priority: extractNphiesCodeAndDisplayFromCodingType(priority).code,
    subType: extractNphiesCodeAndDisplayFromCodingType(subType).code,
    referalName: getValueFromObject(referral, "display"),
    claimIdentifierType: getIdentifierUrlType(identifier),
    ...getExtensionData(extension),
    ...createRequestRelatedData(related),
    careTeam: isArrayHasData(careTeam)
      ? careTeam.map(({ sequence, role, qualification }) => ({
          sequence,
          role: extractNphiesCodeAndDisplayFromCodingType(role).code,
          practiceCode:
            extractNphiesCodeAndDisplayFromCodingType(qualification).code,
        }))
      : [],
  }),
  Practitioner: ({ resource: { id, name, identifier } }) => {
    const [{ text }] = name || [{}];
    const [value] = extractIdentifierData(identifier);
    return {
      careTeamData: {
        id,
        name: text,
        license: value,
      },
    };
  },
  Patient: extractPatientData,
  Coverage: ({ resource: { relationship, identifier, type } }) => ({
    relationship: extractCoverageRelationship(relationship),
    memberId: getMemberId(identifier),
    coverageType: extractNphiesCodeAndDisplayFromCodingType(type).code,
  }),
  Organization: extractOrganizationData("prov"),
};

const extractionFunctionsMapForInsuranceOrg = {
  Organization: extractOrganizationData("ins"),
};

const extractPreauthOrClaimDataSentToNphies = ({
  nodeServerDataSentToNaphies,
  nphiesResponse,
  nphiesExtractedData,
  cancellationData,
  pollData,
  preauth_pk,
  claim_pk,
}) => {
  let supportInfoData = undefined;
  let diagnosisData = undefined;

  const { id: creationBundleId } = nodeServerDataSentToNaphies || {};
  const { issue } = nphiesResponse || {};

  const issueValues = formatNphiesResponseIssue(issue);

  const {
    supportingInfo,
    diagnosis,
    productsSentToNphies,
    productsTotalNet,
    created,
    priority,
    subType,
    provider,
    referalName,
    offlineRequestDate,
    extensionPriorauthId,
    claimIdentifierType,
    claimRelatedIdentifier,
    careTeam,
    careTeamData,
    ...otherData
  } = mapEntriesAndExtractNeededData({
    nphiesResponse: nodeServerDataSentToNaphies,
    extractionFunctionsMap,
    creationBundleId,
    defaultValue: {},
  });

  const { insurer, receiver } = mapEntriesAndExtractNeededData({
    nphiesResponse: nodeServerDataSentToNaphies,
    extractionFunctionsMap: extractionFunctionsMapForInsuranceOrg,
    creationBundleId,
    defaultValue: {},
  });

  const {
    claimErrors,
    bundleId: nphiesBundleId,
    claimResponseId,
    claimRequestId,
    claimOutcome,
    claimExtensionCode,
    claimDisposition,
    claimPreauthRef,
    claimPeriodStart,
    claimPeriodEnd,
    claimMessageEventType,
    productsData: extractedProductsData,
  } = nphiesExtractedData || {};

  const {
    productErrors,
    supportInfoErrors,
    diagnosisErrors,
    otherClaimErrors,
  } = extractNphiesSentDataErrors(nodeServerDataSentToNaphies, claimErrors);

  const productsData = createProductsData({
    extractedProductsData,
    productsSentToNphies,
    productErrors,
  });

  const totalValues = isArrayHasData(productsData)
    ? productsData.reduce(
        (acc, { extensionTax, extensionPatientShare }) => {
          acc.totalTax = acc.totalTax + (extensionTax || 0);
          return {
            totalTax: acc.totalTax + (extensionTax || 0),
            totalPatientShare:
              acc.totalPatientShare + (extensionPatientShare || 0),
          };
        },
        {
          totalTax: 0,
          totalPatientShare: 0,
        }
      )
    : {};

  if (isArrayHasData(supportingInfo)) {
    supportInfoData = supportingInfo.map(
      ({
        sequence,
        category,
        code,
        valueQuantity,
        valueAttachment,
        valueString,
        timingDate,
        timingPeriod,
      }) => {
        const { code: categoryCode } =
          extractNphiesCodeAndDisplayFromCodingType(category);

        const {
          code: codeValue,
          display,
          text,
        } = extractNphiesCodeAndDisplayFromCodingType(code);

        let value = valueString || timingDate;
        let unit;
        let title;
        let contentType;
        let creation;

        if (valueQuantity) {
          value = valueQuantity.value;
          unit = valueQuantity.code;
        }

        if (valueAttachment) {
          const {
            contentType: _contentType,
            data,
            title: _title,
            creation: _creation,
          } = valueAttachment;

          value =
            !!data && typeof data === "string"
              ? `data:${_contentType};base64,${data}`
              : undefined;
          contentType = _contentType;
          title = _title;
          creation = _creation;
        }

        if (timingPeriod) {
          const { start, end } = timingPeriod;
          value = [start, end].filter(Boolean).join(" ~ ");
        }

        return {
          sequence,
          categoryCode,
          code: codeValue,
          display,
          text,
          value,
          unit,
          title,
          contentType,
          creation,
          error: supportInfoErrors[sequence],
        };
      }
    );
  }

  if (isArrayHasData(diagnosis)) {
    diagnosisData = diagnosis.map(
      ({ sequence, onAdmission, diagnosisCodeableConcept, type }) => {
        const { code: _onAdmission } =
          extractNphiesCodeAndDisplayFromCodingType(onAdmission);

        const { code: diagCode, display: diagDisplay } =
          extractNphiesCodeAndDisplayFromCodingType(diagnosisCodeableConcept);

        const { code: diagType } = extractNphiesCodeAndDisplayFromCodingType(
          isArrayHasData(type) ? type[0] : {}
        );

        return {
          sequence,
          onAdmission: _onAdmission === "y",
          diagCode,
          diagDisplay,
          diagType,
          error: diagnosisErrors[sequence],
        };
      }
    );
  }

  const finalCareTeam =
    isArrayHasData(careTeam) && !!careTeamData
      ? careTeam.map((item) => ({
          ...item,
          ...(careTeamData || null),
        }))
      : [];

  return {
    exsysRecordPk: preauth_pk || claim_pk,
    bundleId: nphiesBundleId,
    claimResponseId,
    claimRequestId,
    creationBundleId,
    messageEventType: claimMessageEventType,
    provider,
    insurer,
    receiver,
    created,
    outcome: claimOutcome,
    disposition: claimDisposition,
    productsTotalNet,
    ...totalValues,
    claimErrors: otherClaimErrors,
    extensionCode: claimExtensionCode,
    careTeam: finalCareTeam,
    diagnosis: diagnosisData,
    products: productsData,
    supportInfo: supportInfoData,
    preAuthRef: isArrayHasData(claimPreauthRef)
      ? claimPreauthRef.join(" - ")
      : claimPreauthRef,
    claimPeriod: [claimPeriodStart, claimPeriodEnd].filter(Boolean).join(" ~ "),
    ...otherData,
    subType,
    priority,
    referalName,
    offlineRequestDate,
    extensionPriorauthId,
    claimIdentifierType,
    claimRelatedIdentifier,
    nodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    nphiesResponse,
    ...issueValues,
    cancellationData: extractCancellationData(cancellationData),
    pollData: extractPollData(pollData, productsSentToNphies),
  };
};

// const base = await findRootYarnWorkSpaces();
// const [{ nodeServerDataSentToNaphies, nphiesResponse, nphiesExtractedData }] =
//   await readJsonFile(`${base}/results/exsys/auth-poll/claim-2.json`, true);

// await writeResultFile({
//   data: extractPreauthOrClaimDataSentToNphies({
//     nphiesExtractedData,
//     nphiesResponse,
//     nodeServerDataSentToNaphies,
//   }),
//   folderName: "exsysFromEnd",
// });

export default extractPreauthOrClaimDataSentToNphies;
