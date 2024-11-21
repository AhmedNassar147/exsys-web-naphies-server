/*
 *
 *
 * Helper: `extractCommunicationRecord`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";

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

  const { creation, contentType } = contentAttachment || {};

  const hasContentAttachment = !!(creation && contentType);

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
    communicationAttachment: hasContentAttachment
      ? contentAttachment
      : undefined,
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
