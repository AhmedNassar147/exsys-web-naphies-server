/*
 *
 * Helper: `extractSavedCommunicationData`.
 *
 */
import { isArrayHasData, isObjectHasData } from "@exsys-web-server/helpers";
import extractCommunicationRecord from "./extractCommunicationRecord.mjs";
import extractCommunicationData from "../../nphiesHelpers/extraction/extractCommunicationData.mjs";

const makeNphiesSendCommunicationData = ({
  nodeServerDataSentToNaphies,
  nphiesResponse,
  nphiesExtractedData,
}) => {
  if (!isObjectHasData(nphiesExtractedData)) {
    return undefined;
  }

  const {
    creationBundleId,
    mainBundleId,
    bundleId,
    extractedTaskData,
    communicationExtractedData,
  } = nphiesExtractedData;

  const builtData = extractCommunicationRecord({
    sentCreationBundleId: creationBundleId,
    mainBundleId,
    bundleId,
    nphiesTaskData: extractedTaskData,
    ...communicationExtractedData,
  });

  return {
    ...builtData,
    nodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    nphiesResponse,
  };
};

const makeExsysCommunicationReplyData = ({
  communication_pk,
  nodeServerDataSentToNaphies,
  nphiesResponse,
  nphiesExtractedData,
}) => {
  if (!isObjectHasData(nphiesExtractedData)) {
    return undefined;
  }

  const { entry } = nodeServerDataSentToNaphies;
  const communicationEntry = entry.find(
    ({ resource: { resourceType } }) => resourceType === "Communication"
  );

  const {
    communicationExtractedData: {
      communicationIdentifier,
      communicationCategory,
      communicationPriority,
      communicationStatus: communicationSentStatus,
      communicationResponseBasedOnType,
      communicationResponseBasedOnId,
      communicationAboutType,
      communicationAboutId,
      communicationAboutSystemType,
      communicationReasonCode,
      communicationPayload,
    },
  } = extractCommunicationData(communicationEntry);

  const {
    creationBundleId,
    bundleId,
    communicationRequestId,
    communicationResponseId,
    communicationStatus,
    communicationOutcome,
    communicationErrors,
    issueError,
    issueErrorCode,
  } = nphiesExtractedData;

  const builtData = extractCommunicationRecord({
    sentCreationBundleId: creationBundleId,
    mainBundleId: bundleId,
    bundleId,
    communicationId: communicationRequestId,
    communicationResponseId,
    communicationIdentifier,
    communicationCategory,
    communicationPriority,
    communicationStatus: communicationSentStatus,
    communicationPayload,
    communicationAboutType,
    communicationAboutId,
    communicationAboutSystemType,
    communicationErrors,
  });

  return {
    communicationPk: communication_pk,
    ...builtData,
    communicationResponseBasedOn: [
      communicationResponseBasedOnId,
      communicationResponseBasedOnType,
    ]
      .filter(Boolean)
      .join(" - "),
    communicationReasonCode,
    issueError,
    issueErrorCode,
    communicationOutcomeStatus: [
      communicationStatus,
      communicationOutcome,
    ].join(" - "),
    nodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    nphiesResponse,
  };
};

const extractSavedCommunicationData = (
  communicationReplyData,
  communicationRequestData
) => {
  const {
    communicationData,
    communicationErrors,
    communicationIssueError,
    communicationIssueErrorCode,
  } = isArrayHasData(communicationReplyData)
    ? communicationReplyData.reduce(
        (acc, { nphiesMessageData, exsysReplyData }, index) => {
          const baseAskingData =
            makeNphiesSendCommunicationData(nphiesMessageData);

          const { communicationErrors: __errors, ...nphiesAskingData } =
            baseAskingData || {};

          const baseReplyData = makeExsysCommunicationReplyData(exsysReplyData);

          const {
            communicationErrors,
            issueError,
            issueErrorCode,
            ...__exsysReplyData
          } = baseReplyData || {};

          if (baseAskingData) {
            acc.communicationData[index] = {
              nphiesAskingData,
            };
          }

          if (baseReplyData) {
            acc.communicationData[index] = {
              ...(acc.communicationData[index] || null),
              exsysReplyData: __exsysReplyData,
            };
          }

          if (issueError) {
            acc.communicationIssueError += ` => ${issueError}`;
          }

          if (issueErrorCode) {
            acc.communicationIssueErrorCode += ` => ${issueErrorCode}`;
          }

          const errors = [__errors, communicationErrors].flat().filter(Boolean);

          if (errors.length) {
            acc.communicationErrors = [
              ...(acc.communicationErrors || []),
              ...errors,
            ];
          }

          return acc;
        },
        {
          communicationErrors: undefined,
          communicationData: [],
          communicationIssueError: "",
          communicationIssueErrorCode: "",
        }
      )
    : {};

  const {
    __communicationRequestData,
    errors,
    communicationRequestIssueError,
    communicationRequestIssueErrorCode,
  } = isArrayHasData(communicationRequestData)
    ? communicationRequestData.reduce(
        (acc, record, index) => {
          const baseData = makeExsysCommunicationReplyData(record);

          const { communicationErrors, issueError, issueErrorCode, ...data } =
            baseData || {};

          if (baseData) {
            acc.__communicationRequestData[index] = data;
          }

          if (!!communicationErrors && communicationErrors.length) {
            acc.errors = [...(acc.errors || []), ...communicationErrors];
          }

          if (issueError) {
            acc.communicationRequestIssueError += ` => ${issueError}`;
          }

          if (issueErrorCode) {
            acc.communicationRequestIssueErrorCode += ` => ${issueErrorCode}`;
          }

          return acc;
        },
        {
          __communicationRequestData: [],
          errors: undefined,
          communicationRequestIssueError: "",
          communicationRequestIssueErrorCode: "",
        }
      )
    : {};

  return {
    communicationData,
    communicationRequestData: __communicationRequestData,
    communicationErrors: communicationErrors,
    communicationRequestErrors: errors,
    communicationIssueError: communicationIssueError || undefined,
    communicationIssueErrorCode: communicationIssueErrorCode || undefined,
    communicationRequestIssueError: communicationRequestIssueError || undefined,
    communicationRequestIssueErrorCode:
      communicationRequestIssueErrorCode || undefined,
  };
};

export default extractSavedCommunicationData;
