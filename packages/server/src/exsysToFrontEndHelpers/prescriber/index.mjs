/*
 *
 * Helper: `extractPrescriberDataSentToNphies`.
 *
 */
import {
  // findRootYarnWorkSpaces,
  // readJsonFile,
  // writeResultFile,
  formatDateToNativeDateParts,
  getLastPartOfUrl,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import { NPHIES_BASE_CODE_TYPES } from "../../constants.mjs";
import mapEntriesAndExtractNeededData from "../../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractIdentifierData from "../../nphiesHelpers/extraction/extractIdentifierData.mjs";
import extractMessageHeaderData from "../../nphiesHelpers/extraction/extractMessageHeaderData.mjs";
import formatNphiesResponseIssue from "../../nphiesHelpers/base/formatNphiesResponseIssue.mjs";
import getValueFromObject from "../../nphiesHelpers/extraction/getValueFromObject.mjs";
import extractPatientData from "../../nphiesHelpers/extraction/extractPatientData.mjs";
import extractNphiesSentDataErrors from "./extractNphiesSentDataErrors.mjs";
import extractCoverageRelationship from "../../nphiesHelpers/extraction/extractCoverageRelationship.mjs";
import extractCancellationData from "./extractCancellationData.mjs";
import extractPollData from "./extractPollData.mjs";
import createProductsData from "./createProductsData.mjs";
import createDiagnosisData from "./createDiagnosisData.mjs";
import extractSavedCommunicationData from "./extractSavedCommunicationData.mjs";

const extractPrescriberDataSentToNphies = ({
  prescriber_pk,
  nodeServerDataSentToNaphies,
  nphiesResponse,
  nphiesExtractedData,
  pollData,
}) => {};
