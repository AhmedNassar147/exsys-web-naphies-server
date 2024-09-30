/*
 *
 *
 * Helper: `extractCommunicationRecord`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractContentAttachment from "./extractContentAttachment.mjs";

const getErrors = (errors) => (isArrayHasData(errors) ? errors : undefined);

const extractCommunicationRecord = ({
  sentCreationBundleId,
  mainBundleId,
  bundleId,
  nphiesTaskData,
  communicationId,
  communicationIdentifier,
  communicationCategory,
  communicationPriority,
  communicationStatus,
  communicationPayload,
  communicationAboutType,
  communicationAboutId,
  communicationAboutSystemType,
  communicationErrors,
}) => {
  const {
    taskResponseId,
    taskIdentifierId,
    taskStatus,
    taskPriority,
    taskErrors,
  } = nphiesTaskData || {};

  const [{ contentString, contentAttachment }] = communicationPayload || [{}];

  const attachmentData = extractContentAttachment(contentAttachment);
  const hasContentAttachment = !!(
    contentAttachment && attachmentData.contentType
  );

  return {
    sentCreationBundleId,

    nphiesResponseMainBundleId: mainBundleId,
    nphiesResponseBundleSectionId: bundleId,
    nphiesResponseTaskId: taskResponseId,
    nphiesResponseTaskIdentifierId: taskIdentifierId,
    nphiesResponseTaskStatus: taskStatus,
    nphiesResponseTaskPriority: taskPriority,
    nphiesResponseTaskErrors: getErrors(taskErrors),

    communicationId,
    communicationIdentifier,
    communicationCategory,
    communicationPriority,
    communicationStatus,
    communicationContentString: contentString,
    communicationAttachment: hasContentAttachment ? attachmentData : undefined,
    communicationErrors: getErrors(communicationErrors),
    communicationAbout: [
      communicationAboutType,
      communicationAboutId,
      communicationAboutSystemType,
    ]
      .filter(Boolean)
      .join(" ~ "),
  };
};

export default extractCommunicationRecord;
