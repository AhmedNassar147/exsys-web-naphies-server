/*
 *
 * Helper: `extractPreauthOrClaimDataSentToNphies`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_BASE_CODE_TYPES,
  NPHIES_API_URLS,
  SUPPORT_INFO_KEY_NAMES,
} from "../../constants.mjs";
import mapEntriesAndExtractNeededData from "../../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractIdentifierData from "../../nphiesHelpers/extraction/extractIdentifierData.mjs";
import extractMessageHeaderData from "../../nphiesHelpers/extraction/extractMessageHeaderData.mjs";
import formatNphiesResponseIssue from "../../nphiesHelpers/base/formatNphiesResponseIssue.mjs";
import getValueFromObject from "../../nphiesHelpers/extraction/getValueFromObject.mjs";
import extraProductExtensionsSentToNphies from "./extraProductExtensionsSentToNphies.mjs";
import extractPatientData from "../base/extractPatientData.mjs";
import extractOrganizationData from "../base/extractOrganizationData.mjs";
import extractProductOrServiceData from "./extractProductOrServiceData.mjs";
import extractNphiesSentDataErrors from "./extractNphiesSentDataErrors.mjs";
import extractCoverageRelationship from "../../nphiesHelpers/extraction/extractCoverageRelationship.mjs";
import extractCancellationData from "./extractCancellationData.mjs";

const { EXTENSION_AUTH_OFFLINE_DATE, EXTENSION_AUTH_ONLINE_RESPONSE } =
  NPHIES_BASE_CODE_TYPES;

const getExtensionData = (extension) => {
  if (isArrayHasData(extension)) {
    return extension.reduce((acc, { url, valueDateTime, valueReference }) => {
      if (url.includes(EXTENSION_AUTH_OFFLINE_DATE)) {
        acc.offlineRequestDate = valueDateTime;
      }

      if (url.includes(EXTENSION_AUTH_ONLINE_RESPONSE)) {
        const { identifier } = valueReference;
        acc.extensionPriorauthId = getValueFromObject(identifier);
      }

      return acc;
    }, {});
  }

  return null;
};

const getIdentifierUrlType = (identifier) => {
  const [, system] = extractIdentifierData(identifier);
  const parts = (system || "").split("/");
  const type = parts[parts.length - 1];
  return type ? type : undefined;
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
    },
  }) => ({
    supportingInfo,
    diagnosis,
    productsSentToNphies: item,
    productsTotalNet: getValueFromObject(total),
    created,
    priority: extractNphiesCodeAndDisplayFromCodingType(priority).code,
    subType: extractNphiesCodeAndDisplayFromCodingType(subType).code,
    referalName: getValueFromObject(referral, "display").code,
    claimIdentifierType: getIdentifierUrlType(identifier),
    ...getExtensionData(extension),
  }),
  Patient: extractPatientData,
  Coverage: ({ resource: { relationship } }) => ({
    relationship: extractCoverageRelationship(relationship),
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
  let productsData = undefined;
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
    patientFileNo,
    patientName,
    patientBirthDate,
    patientGender,
    patientPhone,
    patientIdentifierIdType,
    priority,
    subType,
    relationship,
    provider,
    referalName,
    offlineRequestDate,
    extensionPriorauthId,
    claimIdentifierType,
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
  } = extractNphiesSentDataErrors({
    claimErrors,
  });

  const groupedExtractedProductsDataBySequence = isArrayHasData(
    extractedProductsData
  )
    ? extractedProductsData.reduce((acc, { sequence, ...otherValues }) => {
        acc[sequence] = otherValues;
        return acc;
      }, {})
    : {};

  if (isArrayHasData(productsSentToNphies)) {
    productsData = productsSentToNphies.map(
      ({
        sequence,
        extension,
        productOrService,
        quantity,
        unitPrice,
        factor,
        net,
        servicedDate,
        bodySite,
      }) => ({
        sequence,
        ...extractProductOrServiceData(productOrService),
        servicedDate,
        quantity: getValueFromObject(quantity),
        unitPrice: getValueFromObject(unitPrice),
        ...extraProductExtensionsSentToNphies(extension),
        net_price: getValueFromObject(net),
        factor,
        tooth: extractNphiesCodeAndDisplayFromCodingType(bodySite).code,
        error: productErrors[sequence],
        ...(groupedExtractedProductsDataBySequence[sequence] || null),
        extendable: "y",
      })
    );
  }

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

  return {
    exsysRecordPk: preauth_pk || claim_pk,
    bundleId: nphiesBundleId,
    claimResponseId,
    claimRequestId,
    creationBundleId,
    messageEventType: claimMessageEventType,
    created,
    disposition: claimDisposition,
    productsTotalNet,
    claimErrors: otherClaimErrors,
    outcome: claimOutcome,
    extensionCode: claimExtensionCode,
    diagnosis: diagnosisData,
    products: productsData,
    supportInfo: supportInfoData,
    preAuthRef: isArrayHasData(claimPreauthRef)
      ? claimPreauthRef.join(" - ")
      : claimPreauthRef,
    claimPeriod: [claimPeriodStart, claimPeriodEnd].filter(Boolean).join(" ~ "),
    patientFileNo,
    patientName,
    patientBirthDate,
    patientGender,
    patientPhone,
    patientIdentifierIdType,
    subType,
    priority,
    relationship,
    provider,
    insurer,
    receiver,
    referalName,
    offlineRequestDate,
    extensionPriorauthId,
    claimIdentifierType,
    nodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    nphiesResponse,
    ...issueValues,
    cancellationData: extractCancellationData(cancellationData),
  };
};

export default extractPreauthOrClaimDataSentToNphies;
