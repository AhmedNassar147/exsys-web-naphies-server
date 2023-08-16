/*
 *
 * Helper: `extractPreauthOrClaimDataSentToNphies`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import mapEntriesAndExtractNeededData from "../../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractMessageHeaderData from "../../nphiesHelpers/extraction/extractMessageHeaderData.mjs";
import formatNphiesResponseIssue from "../../nphiesHelpers/base/formatNphiesResponseIssue.mjs";
import getValueFromObject from "../../nphiesHelpers/extraction/getValueFromObject.mjs";
import extraProductExtensionsSentToNphies from "./extraProductExtensionsSentToNphies.mjs";
import extractPatientData from "../base/extractPatientData.mjs";
import extractOrganizationData from "../base/extractOrganizationData.mjs";
import extractProductOrServiceData from "./extractProductOrServiceData.mjs";
import extractNphiesSentDataErrors from "./extractNphiesSentDataErrors.mjs";
import extractCoverageRelationship from "../../nphiesHelpers/extraction/extractCoverageRelationship.mjs";

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
    },
  }) => ({
    supportingInfo,
    diagnosis,
    productsSentToNphies: item,
    productsTotalNet: getValueFromObject(total),
    created,
    priority: extractNphiesCodeAndDisplayFromCodingType(priority).code,
    subType: extractNphiesCodeAndDisplayFromCodingType(subType).code,
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
  cancellationExsysRequestData,
  cancellationNphiesResponse,
  cancellationExtractedData,
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
  } = mapEntriesAndExtractNeededData({
    nphiesResponse: nodeServerDataSentToNaphies,
    extractionFunctionsMap,
    creationBundleId,
  });

  const { insurer, receiver } = mapEntriesAndExtractNeededData({
    nphiesResponse: nodeServerDataSentToNaphies,
    extractionFunctionsMap: extractionFunctionsMapForInsuranceOrg,
    creationBundleId,
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
  } = nphiesExtractedData;

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

  const {
    cancellationResponseId,
    cancellationRequestId,
    cancellationQueuedRequestId,
    cancellationStatus,
    cancellationOutcome,
    cancellationErrors,
  } = cancellationExtractedData || {};

  return {
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
    nodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    nphiesResponse,
    cancellationExsysRequestData,
    cancellationNphiesResponse,
    cancellationResponseId,
    cancellationRequestId,
    cancellationQueuedRequestId,
    cancellationStatus,
    cancellationOutcome,
    cancellationErrors,
    ...issueValues,
  };
};

export default extractPreauthOrClaimDataSentToNphies;
