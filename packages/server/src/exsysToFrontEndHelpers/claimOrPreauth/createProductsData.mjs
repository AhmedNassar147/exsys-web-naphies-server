/*
 *
 * Helper: `createProductsData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import getValueFromObject from "../../nphiesHelpers/extraction/getValueFromObject.mjs";
import extractProductOrServiceData from "./extractProductOrServiceData.mjs";
import extraProductExtensionsSentToNphies from "./extraProductExtensionsSentToNphies.mjs";

const createProductsData = ({
  extractedProductsData,
  productsSentToNphies,
  productErrors,
}) => {
  let productsData = undefined;

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
        error: productErrors ? productErrors[sequence] : undefined,
        ...(groupedExtractedProductsDataBySequence[sequence] || null),
        extendable: "y",
      })
    );
  }

  return productsData;
};

export default createProductsData;
