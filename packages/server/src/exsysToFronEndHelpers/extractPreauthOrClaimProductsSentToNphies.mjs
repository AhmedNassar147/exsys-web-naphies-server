/*
 *
 * Helper: `extractPreauthOrClaimDataSentToNphies`.
 *
 */
const { isArrayHasData } = require("@exsys-web-server/helpers");
import mapEntriesAndExtractNeededData from "../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import getValueFromObject from "../nphiesHelpers/extraction/getValueFromObject.mjs";
import extraProductExtensionsSentToNphies from "./extraProductExtensionsSentToNphies.mjs";
import extractProductOrServiceData from "./extractProductOrServiceData.mjs";

const extractionFunctionsMap = {
  Claim: ({ supportingInfo, diagnosis, item, total }) => ({
    supportingInfo,
    diagnosis,
    productsSentToNphies: item,
    total,
  }),
};

const extractPreauthOrClaimDataSentToNphies = ({
  nphiesExtractedData,
  nodeServerDataSentToNaphies,
}) => {
  const productsData = [];

  const {
    bundleId,
    supportingInfo,
    diagnosis,
    productsSentToNphies,
    total,
    bodySite,
  } = mapEntriesAndExtractNeededData(
    nodeServerDataSentToNaphies,
    extractionFunctionsMap
  );

  const { claimErrors } = nphiesExtractedData;

  const errors = nphiesExtractedData();

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
      })
    );
  }

  return {
    productsData,
    productsTotalNet: getValueFromObject(total),
  };
};

export default extractPreauthOrClaimDataSentToNphies;
