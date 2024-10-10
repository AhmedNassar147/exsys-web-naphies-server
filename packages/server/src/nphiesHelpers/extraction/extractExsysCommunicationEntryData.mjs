/*
 *
 * Helper: `extractExsysCommunicationEntryData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import formatNphiesResponseIssue from "../base/formatNphiesResponseIssue.mjs";
import extractCommunicationPollDataData from "./extractCommunicationPollData.mjs";

const communicationEntryHandler = ({ entryGroupArray }) => {
  const result = extractCommunicationPollDataData({ entryGroupArray });

  if (!result) {
    return result;
  }

  const { communicationExtractedData } = result;

  return communicationExtractedData;
};

const extractExsysCommunicationEntryData = {
  Communication: communicationEntryHandler,
  CommunicationRequest: communicationEntryHandler,
  // Communication +  CommunicationRequest must run before  MessageHeader
  MessageHeader: ({ entryGroupArray }) => {
    if (!isArrayHasData(entryGroupArray)) {
      return null;
    }

    const [{ resource }] = entryGroupArray;

    const { id, response } = resource;

    const { identifier, code } = response || {};

    const outcome = code || "error";

    return {
      communicationRequestId: identifier,
      communicationResponseId: id,
      communicationStatus: code,
      communicationOutcome: outcome.includes("error") ? "error" : outcome,
    };
  },
  OperationOutcome: ({ entryGroupArray }) => {
    if (!isArrayHasData(entryGroupArray)) {
      return null;
    }

    const [{ resource }] = entryGroupArray;

    const { issue } = resource;

    return formatNphiesResponseIssue(issue);
  },
};

export default extractExsysCommunicationEntryData;
