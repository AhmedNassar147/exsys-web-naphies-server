/*
 *
 * Helper: `createBaseEntryRequestData`.
 *
 */
import { getCurrentDate, isArrayHasData } from "@exsys-web-server/helpers";
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import { NPHIES_API_URLS, NPHIES_BASE_CODE_TYPES } from "../../constants.mjs";

const { BASE_TERMINOLOGY_CODE_SYS_URL } = NPHIES_API_URLS;
const { PROCESS_PRIORITY } = NPHIES_BASE_CODE_TYPES;

const createBaseEntryRequestData = ({
  requestId,
  providerOrganization,
  payerOrganization,
  patientId,
  businessArrangement,
  providerPatientUrl,
  providerOrganizationUrl,
  providerCoverageUrl,
  providerFocusUrl,
  identifierUrl,
  identifierId,
  insuranceSequence,
  insuranceFocal,
  insurancePreauthRefs,
  resourceType,
  profileType,
  extension,
  priority,
}) => {
  const { dateString } = getCurrentDate(true);

  return {
    fullUrl: `${providerFocusUrl}/${requestId}`,
    resource: {
      ...createNphiesBaseResource({
        resourceType,
        profileType,
        uuid: requestId,
      }),
      extension,
      identifier: [
        {
          system: identifierUrl || providerFocusUrl,
          value: identifierId || `req_${requestId}`,
        },
      ],
      status: "active",
      patient: {
        reference: `${providerPatientUrl}/${patientId}`,
      },
      created: dateString,
      insurer: {
        reference: `${providerOrganizationUrl}/${payerOrganization}`,
      },
      provider: {
        reference: `${providerOrganizationUrl}/${providerOrganization}`,
      },
      priority: {
        coding: [
          {
            system: `${BASE_TERMINOLOGY_CODE_SYS_URL}/${PROCESS_PRIORITY}`,
            code: priority || "normal",
          },
        ],
      },
      insurance: [
        {
          sequence: insuranceSequence,
          focal: insuranceFocal,
          coverage: {
            reference: `${providerCoverageUrl}/${requestId}`,
          },
          businessArrangement,
          preAuthRef: isArrayHasData(insurancePreauthRefs)
            ? insurancePreauthRefs
            : undefined,
        },
      ],
    },
  };
};

export default createBaseEntryRequestData;
