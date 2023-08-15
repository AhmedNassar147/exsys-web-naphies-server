/*
 *
 * Helper: `extractCommunicationData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
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
  const [{ type, identifier: aboutType }] = about || [{}];
  const [typeId] = extractIdentifierData(aboutType);

  const { code: _reasonCode } =
    extractNphiesCodeAndDisplayFromCodingType(reasonCode);

  const [{ type: basedOnType, identifier: basedOnIdentifier }] = basedOn || [
    {},
  ];
  const [communicationResponseBasedOnId] =
    extractIdentifierData(basedOnIdentifier);

  const communicationErrors = extractErrorsArray(error);

  return {
    communicationId: id,
    communicationIdentifier: (communicationIdentifier || "").replace(
      "req_",
      ""
    ),
    communicationCategory: code,
    communicationPriority: priority,
    communicationStatus: status,
    communicationResponseBasedOnType: basedOnType,
    communicationResponseBasedOnId: (
      communicationResponseBasedOnId || ""
    ).replace("req_", ""),
    communicationType: (type || "").toLowerCase(),
    communicationTypeId: (typeId || "").replace("req_", ""),
    communicationReasonCode: _reasonCode,
    communicationPayload: payload,
    communicationErrors,
  };
};

export default extractCommunicationData;
