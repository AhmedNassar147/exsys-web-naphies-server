/*
 *
 * Helper: `extractClaimRequestData`.
 *
 */
import {
  formatDateToNativeDateParts,
  getLastPartOfUrl,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import createDiagnosisDataWithErrors from "../base/createDiagnosisDataWithErrors.mjs";
import createSupportInfoDataWithErrors from "../base/createSupportInfoDataWithErrors.mjs";
import getPreAuthRefFromInsurance from "./getPreAuthRefFromInsurance.mjs";
import createAndMergeProductsDataWithErrors from "./createAndMergeProductsDataWithErrors.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import getIdentifierUrlType from "./getIdentifierUrlType.mjs";
import extractAccidentData from "./extractAccidentData.mjs";
import extractBillableDates from "./extractBillableDates.mjs";
import extractNphiesDataRelatedData from "./extractRelatedData.mjs";
import extractClaimSentNphiesDataExtensions from "./extractClaimSentNphiesDataExtensions.mjs";
import extractSentPractitionerData from "./extractSentPractitionerData.mjs";
import getValueFromObject from "./getValueFromObject.mjs";
import extractNphiesSentDataErrors from "./extractNphiesSentDataErrors.mjs";

const extractClaimRequestData = ({
  entryGroupArray,
  groupedEntries,
  nphiesResponseEntryResults,
  dataSentToNphiesIndicesMap,
}) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;

  const {
    id,
    total,
    created,
    priority,
    type,
    subType,
    referral,
    identifier,
    related,
    insurance,
    accident,
    billablePeriod,
    supportingInfo,
    diagnosis,
    item,
    extension,
    careTeam,
    payee,
  } = resource;

  const practitionerEntries = groupedEntries["Practitioner"];

  const practitionerData =
    extractSentPractitionerData({
      entryGroupArray: practitionerEntries,
    }) || {};

  const careTeamData = isArrayHasData(careTeam)
    ? careTeam.map(({ sequence, role, qualification, provider }) => {
        const { reference } = provider;
        const id = getLastPartOfUrl(reference);
        const doctorRelatedData = practitionerData[id];

        return {
          sequence,
          id,
          ...doctorRelatedData,
          role: extractNphiesCodeAndDisplayFromCodingType(role).code,
          practiceCode:
            extractNphiesCodeAndDisplayFromCodingType(qualification).code,
        };
      })
    : [];

  const { claimErrors, productsData: extractedProductsData } =
    nphiesResponseEntryResults || {};

  const {
    productErrors,
    supportInfoErrors,
    diagnosisErrors,
    otherClaimErrors,
  } = extractNphiesSentDataErrors(dataSentToNphiesIndicesMap, claimErrors);

  const diagnosisData = createDiagnosisDataWithErrors(
    diagnosis,
    diagnosisErrors
  );

  const { productsData, totalValues } = createAndMergeProductsDataWithErrors({
    extractedProductsData,
    productsSentToNphies: item,
    productErrors,
  });

  const supportInfoData = createSupportInfoDataWithErrors(
    supportingInfo,
    supportInfoErrors
  );

  const { type: payeeType } = payee || {};

  return {
    claimRequestId: id,
    claimMessageEventType: extractNphiesCodeAndDisplayFromCodingType(type).code,
    created: formatDateToNativeDateParts(created, {
      stringifyReturnedDate: true,
    }),
    preAuthRef: getPreAuthRefFromInsurance(insurance),
    priority: extractNphiesCodeAndDisplayFromCodingType(priority).code,
    subType: extractNphiesCodeAndDisplayFromCodingType(subType).code,
    referalName: getValueFromObject(referral, "display"),
    payeeType: extractNphiesCodeAndDisplayFromCodingType(payeeType).code,
    claimIdentifierType: getIdentifierUrlType(identifier),
    ...extractClaimSentNphiesDataExtensions(extension),
    ...extractNphiesDataRelatedData(related),
    ...extractAccidentData(accident),
    ...extractBillableDates(billablePeriod),
    careTeam: careTeamData,
    diagnosisData,
    productsData,
    supportInfoData,
    totalValues,
    productsTotalNet: getValueFromObject(total),
    claimErrors: otherClaimErrors,
    productsSentToNphies: item,
    supportingInfoSentToNphies: supportingInfo,
    diagnosisSentToNphies: diagnosis,
  };
};

export default extractClaimRequestData;
