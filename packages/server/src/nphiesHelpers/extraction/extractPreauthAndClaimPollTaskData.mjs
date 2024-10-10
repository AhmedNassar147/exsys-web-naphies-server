/*
 *
 * Helper: `extractPreauthAndClaimPollTaskData`.
 *
 */
import {
  formatDateToNativeDateParts,
  getLastPartOfUrl,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import extractErrorsArray from "./extractErrorsArray.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractNphiesOutputErrors from "./extractNphiesOutputErrors.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "./extractNphiesCodeAndDisplayFromCodingType.mjs";

const getDate = (date) =>
  formatDateToNativeDateParts(date, { stringifyReturnedDate: true });

const extractPreauthAndClaimPollTaskData = ({
  entryGroupArray,
  isRequest,
  isCancelationTask,
  isStatusCheckTask,
}) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;

  const {
    id,
    status,
    identifier,
    focus,
    error,
    output,
    reasonCode,
    priority,
    authoredOn,
    lastModified,
    requester,
  } = resource;

  const [taskIdentifierId] = extractIdentifierData(identifier);

  const __focus = focus || {
    identifier: {},
  };

  const {
    identifier: { value: queuedRequestId },
    type,
  } = __focus;

  const { code: reasonCodeValue } =
    extractNphiesCodeAndDisplayFromCodingType(reasonCode);

  const taskErrors = [
    ...extractErrorsArray(error),
    ...extractNphiesOutputErrors(output),
    ...extractNphiesOutputErrors(output, "type"),
  ].filter(Boolean);

  const { reference } = requester || {};

  const taskIdName = isRequest ? "taskRequestId" : "taskResponseId";

  const __errors = taskErrors.length ? taskErrors : undefined;

  const initialValues = {
    taskIdentifierId,
    taskPriority: priority,
    authoredOn: getDate(authoredOn),
    lastModified: getDate(lastModified),
    requesterOrganization: getLastPartOfUrl(reference) || undefined,
  };

  if (isCancelationTask || isStatusCheckTask) {
    const isClaim = type === "Claim";
    const cleanQueuedRequestId = queuedRequestId.replace("req_", "");

    const requestOrResponseId =
      taskIdentifierId.replace(/Cancel_|resp_/g, "") || id;

    const baseFieldName = isCancelationTask ? "cancellation" : "statusCheck";

    return {
      [`${baseFieldName}ResourceType`]: isStatusCheckTask
        ? isClaim
          ? "ClaimStatusCheck"
          : "PreauthStatusCheck"
        : isClaim
        ? "ClaimCancellation"
        : "PreauthCancellation",
      [`${baseFieldName}ResponseId`]: isRequest
        ? undefined
        : requestOrResponseId,
      [`${baseFieldName}RequestId`]: cleanQueuedRequestId,
      [`${baseFieldName}Status`]: status,
      [`${baseFieldName}Outcome`]: status,
      [`${baseFieldName}ReasonCode`]: reasonCodeValue || undefined,
      [`${baseFieldName}Errors`]: __errors,
      ...initialValues,
    };
  }

  return {
    extractedTaskData: {
      [taskIdName]: id,
      taskStatus: status,
      reasonCode: reasonCodeValue || undefined,
      ...initialValues,
      taskErrors: __errors,
    },
  };
};

export default extractPreauthAndClaimPollTaskData;
