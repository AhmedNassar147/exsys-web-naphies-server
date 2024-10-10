/*
 *
 * Helper: `extractPreauthOrClaimDataSentToNphies`.
 *
 */
import {
  // findRootYarnWorkSpaces,
  // readJsonFile,
  // writeResultFile,
  isObjectHasData,
} from "@exsys-web-server/helpers";
import mapEntriesAndExtractNeededData from "../../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractCancellationData from "./extractCancellationData.mjs";
import extractPollData from "./extractPollData.mjs";
import extractSavedCommunicationData from "./extractSavedCommunicationData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

// const finalCareTeam = makeFinalCareTeamData(careTeam, careTeamData);

// support info
// absenceReasonCode,
// absenceReasonUrlCode,

// diagnosis
// extensionConditionOnset

// accidentDateCode,
// billablePeriod

// product extension
// extensionMaternity boolean

const getClaimsOrPreauthData = ({
  recordId,
  requestType,
  nodeServerDataSentToNaphies,
  nphiesResponse,
  nphiesExtractedData,
}) => {
  if (!isObjectHasData(nphiesExtractedData)) {
    return {};
  }

  const { nphiesRequestExtractedData } = nphiesExtractedData;

  const result = isObjectHasData(nphiesRequestExtractedData)
    ? nphiesExtractedData
    : mapEntriesAndExtractNeededData({
        requestType,
        nphiesResponse,
        nodeServerDataSentToNaphies,
        defaultValue: {},
      });

  const {
    bundleId: nphiesBundleId,
    creationBundleId,
    claimResponseId,
    claimRequestId,
    claimMessageEventType,
    claimOutcome,
    issueError,
    issueErrorCode,
    claimExtensionCode,
    claimDisposition,
    claimPreauthRef,
    claimPeriodStart,
    claimPeriodEnd,
    coverageResponseId,
    coverageNetwork,
    coverageCopayPct,
    coverageCopayPctCode,
    coverageMaxCopay,
    coverageCurrency,
    coverageClasses,
    coverageErrors,
    totalAdjudicationValues,
    processNotes,
    fundsReserveCode,
    nphiesRequestExtractedData: nphiesRequestExtractedDataRes,
  } = result;

  const {
    provider,
    insurer,
    receiver,
    careTeam,
    diagnosisData,
    productsData,
    supportInfoData,
    patientFileNo,
    patientName,
    patientBirthDate,
    patientGender,
    patientPhone,
    patientIdentifierIdType,
    patientIdentifierId,
    priority,
    created,
    subType,
    extensionOccupation,
    maritalStatusCode,
    relationship,
    memberId,
    coverageType,
    referalName,
    billablePeriod,
    productsTotalNet,
    offlineRequestDate,
    extensionPriorauthId,
    extensionEpisodeNo,
    extensionBatchPeriod,
    extensionAccountPeriod,
    extensionIsTransfer,
    claimIdentifierType,
    claimRelatedIdentifier,
    preAuthRef: sentPreAuthRef,
    payeeType,
    accidentDateCode,
    totalValues,
    claimErrors: otherClaimErrors,
    productsSentToNphies,
    supportingInfoSentToNphies,
    diagnosisSentToNphies,
  } = nphiesRequestExtractedDataRes || {};

  return {
    exsysRecordPk: recordId,
    bundleId: nphiesBundleId,
    claimResponseId,
    claimRequestId,
    creationBundleId,
    messageEventType: claimMessageEventType,
    extensionEpisodeNo,
    extensionBatchPeriod,
    extensionAccountPeriod,
    extensionIsTransfer,
    totalAdjudicationValues,
    processNotes,
    fundsReserveCode,
    provider,
    insurer,
    billablePeriod,
    receiver,
    created,
    outcome: claimOutcome,
    disposition: claimDisposition,
    productsTotalNet,
    ...(totalValues || null),
    claimErrors: otherClaimErrors,
    payeeType,
    extensionCode: claimExtensionCode,
    careTeam,
    diagnosis: diagnosisData,
    products: productsData,
    supportInfo: supportInfoData,
    accidentDateCode,
    preAuthRef: claimPreauthRef,
    sentPreAuthRef,
    claimPeriod: [claimPeriodStart, claimPeriodEnd].filter(Boolean).join(" ~ "),
    extensionOccupation,
    maritalStatusCode,
    relationship,
    coverageType,
    subType,
    priority,
    referalName,
    offlineRequestDate,
    extensionPriorauthId,
    claimIdentifierType,
    claimRelatedIdentifier,
    issueError,
    issueErrorCode,
    patientFileNo,
    patientName,
    patientBirthDate,
    patientGender,
    patientPhone,
    patientIdentifierIdType,
    memberId,
    patientIdentifierId,
    coverageResponseId,
    coverageNetwork,
    coverageCopayPct,
    coverageCopayPctCode,
    coverageMaxCopay,
    coverageCurrency,
    coverageClasses,
    coverageErrors,
    productsSentToNphies,
    supportingInfoSentToNphies,
    diagnosisSentToNphies,
    nodeServerDataSentToNphies: nodeServerDataSentToNaphies,
    nphiesResponse,
  };
};

const extractPreauthOrClaimDataSentToNphies = ({
  preauth_pk,
  claim_pk,
  nodeServerDataSentToNaphies,
  nphiesResponse,
  nphiesExtractedData,
  cancellationData,
  pollData,
  communicationReplyData,
  communicationRequestData,
  prescriptionData,
}) => {
  const {
    productsSentToNphies,
    supportingInfoSentToNphies,
    diagnosisSentToNphies,
    ...otherData
  } = getClaimsOrPreauthData({
    recordId: preauth_pk || claim_pk,
    requestType: claim_pk
      ? NPHIES_REQUEST_TYPES.CLAIM
      : NPHIES_REQUEST_TYPES.PREAUTH,
    nodeServerDataSentToNaphies,
    nphiesResponse,
    nphiesExtractedData,
  });

  const { prescription_pk, ...otherPrescriptionData } = prescriptionData || {};

  const {
    productsSentToNphies: prescriberProductsSentToNphies,
    supportingInfoSentToNphies: prescriberSupportingInfoSentToNphies,
    diagnosisSentToNphies: prescriberDiagnosisSentToNphies,
    ...extractedPrescriptionData
  } = getClaimsOrPreauthData({
    recordId: prescription_pk,
    requestType: NPHIES_REQUEST_TYPES.PRESCRIBER,
    ...otherPrescriptionData,
  });

  return {
    ...otherData,
    prescriptionData: isObjectHasData(extractedPrescriptionData)
      ? extractedPrescriptionData
      : undefined,
    pollData: extractPollData(
      pollData,
      productsSentToNphies || prescriberProductsSentToNphies,
      supportingInfoSentToNphies || prescriberSupportingInfoSentToNphies,
      diagnosisSentToNphies || prescriberDiagnosisSentToNphies
    ),
    cancellationData: extractCancellationData(cancellationData),
    ...extractSavedCommunicationData(
      communicationReplyData,
      communicationRequestData
    ),
  };
};

// const base = await findRootYarnWorkSpaces();
// // const [result] = await readJsonFile(`${base}/results/exsys/test2.json`, true);
// const [result] = await readJsonFile(`${base}/results/exsys/test4.json`, true);

// await writeResultFile({
//   data: extractPreauthOrClaimDataSentToNphies(result),
//   folderName: "__exsysFromEndnew",
// });

export default extractPreauthOrClaimDataSentToNphies;
