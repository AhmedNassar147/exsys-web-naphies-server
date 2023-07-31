/*
 *
 * Helper: `extractPreauthOrClaimDataSentToNphies`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import mapEntriesAndExtractNeededData from "../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import getValueFromObject from "../nphiesHelpers/extraction/getValueFromObject.mjs";
import extraProductExtensionsSentToNphies from "./extraProductExtensionsSentToNphies.mjs";
import extractProductOrServiceData from "./extractProductOrServiceData.mjs";
import extractNphiesSentDataErrors from "./extractNphiesSentDataErrors.mjs";

const extractionFunctionsMap = {
  Claim: ({
    resource: {
      supportingInfo,
      diagnosis,
      item,
      total,
      type,
      insurance,
      created,
    },
  }) => ({
    supportingInfo,
    diagnosis,
    productsSentToNphies: item,
    productsTotalNet: getValueFromObject(total),
    messageEventType: extractNphiesCodeAndDisplayFromCodingType(type).code,
    insurance,
    requestSentToNphiesAt: created,
  }),
};

const extractPreauthOrClaimDataSentToNphies = ({
  nphiesExtractedData,
  nodeServerDataSentToNaphies,
}) => {
  let productsData = undefined;
  let supportInfoData = undefined;
  let diagnosisData = undefined;

  const { id: creationBundleId } = nodeServerDataSentToNaphies;

  const {
    supportingInfo,
    diagnosis,
    productsSentToNphies,
    productsTotalNet,
    messageEventType,
    insurance,
    requestSentToNphiesAt,
  } = mapEntriesAndExtractNeededData({
    nphiesResponse: nodeServerDataSentToNaphies,
    extractionFunctionsMap,
    creationBundleId,
  });

  const { claimErrors } = nphiesExtractedData;

  const {
    productErrors,
    supportInfoErrors,
    diagnosisErrors,
    otherClaimErrors,
  } = extractNphiesSentDataErrors({
    claimErrors,
  });

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

  const [{ preAuthRef }] = insurance || [{}];

  return {
    creationBundleId,
    messageEventType,
    requestSentToNphiesAt,
    preAuthRef,
    productsData,
    productsTotalNet,
    supportInfoData,
    diagnosisData,
    claimErrors: otherClaimErrors,
  };
};

export default extractPreauthOrClaimDataSentToNphies;
