/*
 *
 * Helper: `extractEncounterRequestData`.
 *
 */
import {
  formatDateToNativeDateParts,
  getLastPartOfUrl,
  isArrayHasData,
  isObjectHasData,
} from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractClaimResponseExtensions from "./extractClaimResponseExtensions.mjs";

const dateOptions = {
  stringifyReturnedDate: true,
};

const extractEncounterRequestData = ({ entryGroupArray }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;

  const {
    id,
    extension: globalExtensions,
    identifier,
    status,
    class: classData,
    serviceType,
    subject,
    period,
    serviceProvider,
    hospitalization,
  } = resource;

  const [encounterIdentifierId, encounterIdentifierUrl] =
    extractIdentifierData(identifier);

  const {
    system: encounterClassUrl,
    code: encounterClassCode,
    display: encounterClassDisplay,
  } = classData || {};

  const {
    code: encounterServiceTypeCode,
    codingSystemUrl: encounterServiceTypeUrl,
    display: encounterServiceTypeDisplay,
    text: encounterServiceTypeText,
  } = extractNphiesCodeAndDisplayFromCodingType(serviceType);

  const { reference } = subject || {};
  const encounterPatientFileNo = getLastPartOfUrl(reference) || undefined;

  const { start, end } = period || {};

  const { reference: serviceProviderRef } = serviceProvider || {};
  const encounterServiceProviderId =
    getLastPartOfUrl(serviceProviderRef) || undefined;

  const { extension, admitSource, dischargeDisposition, reAdmission, origin } =
    hospitalization || {};

  const {
    code: admitSourceCode,
    codingSystemUrl: admitSourceUrl,
    display: admitSourceDisplay,
    text: admitSourceText,
  } = extractNphiesCodeAndDisplayFromCodingType(admitSource);

  const {
    code: dispositionCode,
    codingSystemUrl: dispositionUrl,
    display: dispositionDisplay,
    text: dispositionText,
  } = extractNphiesCodeAndDisplayFromCodingType(dischargeDisposition);

  const {
    code: reAdmissionCode,
    codingSystemUrl: reAdmissionUrl,
    display: reAdmissionDisplay,
    text: reAdmissionText,
  } = extractNphiesCodeAndDisplayFromCodingType(reAdmission);

  const { reference: originRef } = origin || {};
  const originId = getLastPartOfUrl(originRef) || undefined;

  const { extensionOthersValues: globalExtensionsValues } =
    extractClaimResponseExtensions(globalExtensions, true);
  const { extensionOthersValues } = extractClaimResponseExtensions(
    extension,
    true
  );

  const encounterHospitalization = {
    admitSourceCode,
    admitSourceUrl,
    admitSourceDisplay,
    admitSourceText,
    dispositionCode,
    dispositionUrl,
    dispositionDisplay,
    dispositionText,
    reAdmissionCode,
    reAdmissionUrl,
    reAdmissionDisplay,
    reAdmissionText,
    originId,
    extensions: isObjectHasData(extensionOthersValues)
      ? extensionOthersValues
      : undefined,
  };

  return {
    encounterRequestId: id,
    encounterGlobalExtensionsValues: isObjectHasData(globalExtensionsValues)
      ? globalExtensionsValues
      : undefined,
    encounterIdentifierId,
    encounterIdentifierUrl,
    encounterStatus: status,
    encounterClassUrl,
    encounterClassCode,
    encounterClassDisplay,
    encounterServiceTypeCode,
    encounterServiceTypeUrl,
    encounterServiceTypeDisplay,
    encounterServiceTypeText,
    encounterPatientFileNo,
    encounterPeriodStart: formatDateToNativeDateParts(start, dateOptions),
    encounterPeriodEnd: formatDateToNativeDateParts(end, dateOptions),
    encounterServiceProviderId,
    encounterHospitalization,
  };
};

export default extractEncounterRequestData;
