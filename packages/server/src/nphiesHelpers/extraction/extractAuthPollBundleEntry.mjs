/*
 *
 * Helper: `extractAuthPollBundleEntry`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import makeEntriesGroupByResourceType from "../base/makeEntriesGroupByResourceType.mjs";
import formatNphiesResponseIssue from "../base/formatNphiesResponseIssue.mjs";
import extractMessageHeaderData from "./extractMessageHeaderData.mjs";
import extractClaimResponseData from "./extractClaimResponseData.mjs";
import extractCoverageData from "./extractCoverageData.mjs";
import extractOrganizationsData from "./extractOrganizationsData.mjs";
import extractPatientData from "./extractPatientData.mjs";
import extractCommunicationPollData from "./extractCommunicationPollData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const extractAuthPollBundleEntry = ({ entryGroupArray, mainRequestId }) => {
  if (!isArrayHasData(entryGroupArray)) {
    return null;
  }

  const [{ resource }] = entryGroupArray;
  const { id, entry, issue } = resource;

  const {
    Coverage,
    MessageHeader,
    ClaimResponse,
    Patient,
    Organization,
    CommunicationRequest,
  } = makeEntriesGroupByResourceType(entry);
  const issueValues = formatNphiesResponseIssue(issue);

  const { messageHeaderRequestType, ...messageHeaderData } =
    extractMessageHeaderData(/-response|-request/)({
      entryGroupArray: MessageHeader,
    }) || {};

  // const __messageHeaderRequestType =
  //   messageHeaderRequestType === "advanced-authorization"
  //     ? NPHIES_REQUEST_TYPES.PREAUTH
  //     : messageHeaderRequestType;

  return {
    creationBundleId: mainRequestId,
    bundleId: id,
    ...issueValues,
    originalHeaderRequestType: messageHeaderRequestType,
    messageHeaderRequestType: messageHeaderRequestType,
    ...messageHeaderData,
    ...extractPatientData({
      entryGroupArray: Patient,
    }),
    ...extractOrganizationsData({
      entryGroupArray: Organization,
    }),
    ...extractCoverageData({
      entryGroupArray: Coverage,
    }),
    ...extractCommunicationPollData({
      entryGroupArray: CommunicationRequest,
    }),
    ...extractClaimResponseData({
      entryGroupArray: ClaimResponse,
      isPollResponse: true,
    }),
  };
};

export default extractAuthPollBundleEntry;
