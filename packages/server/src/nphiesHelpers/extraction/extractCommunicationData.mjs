/*
 *
 * Helper: `extractCommunicationData`.
 *
 */
import { isArrayHasData, getLastPartOfUrl } from "@exsys-web-server/helpers";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractErrorsArray from "./extractErrorsArray.mjs";

const extractCommunicationData = ({
  resource: {
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
  },
}) => {
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
      communicationIdentifier: (communicationIdentifier || "").replace(
        /req_|CommReq_/,
        ""
      ),
      communicationCategory: code,
      communicationPriority: priority,
      communicationStatus: status,
      communicationResponseBasedOnType: basedOnType,
      communicationResponseBasedOnId: communicationResponseBasedOnId
        ? communicationResponseBasedOnId.replace("req_", "")
        : undefined,
      communicationAboutType,
      communicationAboutId: typeId ? typeId.replace("req_", "") : undefined,
      communicationAboutSystemType: getLastPartOfUrl(typeSystem),
      communicationReasonCode: _reasonCode,
      communicationPayload: payload,
      communicationErrors,
    },
  };
};

export default extractCommunicationData;
