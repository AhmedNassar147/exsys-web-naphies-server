/*
 *
 * Helper: `createAllOrganizationEntries`.
 *
 */
import { ORGANIZATION_SECTION_TYPES } from "../../constants.mjs";
import createOrganizationData from "./createOrganizationData.mjs";

const createAllOrganizationEntries = ({
  organizationLicense,
  organizationReference,
  siteName,
  providerOrganizationUrl,
  providerTypeCode,
  providerTypeDisplay,
  payerLicense,
  payerReference,
  payerName,
  policyHolderLicense,
  policyHolderReference,
  policyHolderName,
}) =>
  [
    createOrganizationData({
      organizationType: ORGANIZATION_SECTION_TYPES.P,
      organizationLicense,
      organizationReference,
      siteName,
      providerOrganizationUrl,
      providerTypeCode,
      providerTypeDisplay,
    }),
    !!(payerLicense && payerReference) &&
      createOrganizationData({
        organizationType: ORGANIZATION_SECTION_TYPES.I,
        organizationLicense: payerLicense,
        organizationReference: payerReference,
        siteName: payerName,
        providerOrganizationUrl,
      }),
    !!(policyHolderLicense && policyHolderReference) &&
      createOrganizationData({
        organizationLicense: policyHolderLicense,
        organizationReference: policyHolderReference,
        siteName: policyHolderName,
        providerOrganizationUrl,
        organizationType: ORGANIZATION_SECTION_TYPES.PH,
      }),
  ].filter(Boolean);

export default createAllOrganizationEntries;
