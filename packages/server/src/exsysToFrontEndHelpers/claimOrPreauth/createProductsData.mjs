/*
 *
 * Helper: `createProductsData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import getValueFromObject from "../../nphiesHelpers/extraction/getValueFromObject.mjs";
import extractProductOrServiceData from "./extractProductOrServiceData.mjs";
import extractExtensionsSentToNphies from "../../nphiesHelpers/extraction/extractExtensionsSentToNphies.mjs";

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
        ...extractExtensionsSentToNphies(extension),
        net_price: getValueFromObject(net),
        factor,
        tooth: extractNphiesCodeAndDisplayFromCodingType(bodySite).code,
        error: productErrors ? productErrors[sequence] : undefined,
        ...(groupedExtractedProductsDataBySequence[sequence] || null),
        extendable: "y",
      })
    );
  }

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

  return { productsData, totalValues };
};

export default createProductsData;
