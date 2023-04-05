/*
 *
 * Helper: `createProviderUrls`.
 *
 */
import { NPHIES_RESOURCE_TYPES } from "../../constants.mjs";

const {
  PATIENT,
  RESOURCE_COVERAGE,
  ORGANIZATION,
  COVERAGE_ELIGIBILITY_REQUEST,
  RESOURCE_MESSAGE_HEADER,
  LOCATION,
} = NPHIES_RESOURCE_TYPES;

const createProviderUrls = (provider_base_url) => ({
  providerPatientUrl: `${provider_base_url}/${PATIENT}`,
  providerCoverageUrl: `${provider_base_url}/${RESOURCE_COVERAGE}`,
  providerOrganizationUrl: `${provider_base_url}/${ORGANIZATION}`,
  providerCoverageEligibilityUrl: `${provider_base_url}/${COVERAGE_ELIGIBILITY_REQUEST}`,
  providerMessageHeaderUrl: `${provider_base_url}/${RESOURCE_MESSAGE_HEADER}`,
  providerLocationUrl: `${provider_base_url}/${LOCATION}`,
});

export default createProviderUrls;
