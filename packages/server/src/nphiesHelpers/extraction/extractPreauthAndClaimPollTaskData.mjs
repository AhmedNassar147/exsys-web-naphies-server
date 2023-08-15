/*
 *
 * Helper: `extractPreauthAndClaimPollTaskData`.
 *
 */
import extractErrorsArray from "./extractErrorsArray.mjs";
import extractIdentifierData from "./extractIdentifierData.mjs";
import extractNphiesOutputErrors from "./extractNphiesOutputErrors.mjs";

const extractPreauthAndClaimPollTaskData = ({
  resource: { id, status, priority, output, identifier, error },
}) => {
  const [taskIdentifierId] = extractIdentifierData(identifier);

  const taskErrors = [
    ...extractErrorsArray(error),
    ...extractNphiesOutputErrors(output),
  ];

  return {
    extractedTaskData: {
      taskResponseId: id,
      taskIdentifierId,
      taskStatus: status,
      taskPriority: priority,
      taskErrors,
    },
  };
};

export default extractPreauthAndClaimPollTaskData;
