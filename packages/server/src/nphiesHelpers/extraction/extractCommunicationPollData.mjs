/*
 *
 * Helper: `extractCommunicationPollDataData`.
 *
 */
import { isArrayHasData, getLastPartOfUrl } from "@exsys-web-server/helpers";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractErrorsArray from "./extractErrorsArray.mjs";

const extractCommunicationPollDataData = ({ entryGroupArray }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;

  const {
    id,
    category,
    identifier,
    priority,
    about,
    payload,
    reasonCode,
    error,
    status,
    basedOn,
  } = resource;

  const [communicationIdentifier] = extractIdentifierData(identifier);

  const { code } = extractNphiesCodeAndDisplayFromCodingType(
    isArrayHasData(category) ? category[0] : category
  );
  const [{ type: communicationAboutType, identifier: aboutType }] = about || [
    {},
  ];
  const [typeId, typeSystem] = extractIdentifierData(aboutType);

  const { code: _reasonCode } =
    extractNphiesCodeAndDisplayFromCodingType(reasonCode);

  const [{ type: basedOnType, identifier: basedOnIdentifier }] = basedOn || [
    {},
  ];
  const [communicationResponseBasedOnId] =
    extractIdentifierData(basedOnIdentifier);

  const communicationErrors = extractErrorsArray(error);

  return {
    communicationExtractedData: {
      communicationId: id,
      communicationIdentifier,
      communicationCategory: code,
      communicationPriority: priority,
      communicationStatus: status,
      communicationResponseBasedOnType: basedOnType,
      communicationResponseBasedOnId:
        communicationResponseBasedOnId || undefined,
      communicationAboutType,
      communicationAboutId: typeId || undefined,
      communicationAboutSystemType: getLastPartOfUrl(typeSystem) || undefined,
      communicationReasonCode: _reasonCode,
      communicationPayload: payload,
      communicationErrors,
    },
  };
};

export default extractCommunicationPollDataData;
