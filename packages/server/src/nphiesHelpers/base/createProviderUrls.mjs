/*
 *
 * Helper: `createProviderUrls`.
 *
 */
import {
  NPHIES_RESOURCE_TYPES,
  NPHIES_RESOURCE_MAP_TO_REQUEST_TYPE,
} from "../../constants.mjs";

const {
  PATIENT,
  COVERAGE,
  ORGANIZATION,
  LOCATION,
  PRACTITIONER,
  VISION_PRESCRIPTION,
  ENCOUNTER,
} = NPHIES_RESOURCE_TYPES;

const createProviderUrls = ({ providerBaseUrl, requestType }) => {
  const requestTypeValue = NPHIES_RESOURCE_MAP_TO_REQUEST_TYPE[requestType];

  return {
    providerPatientUrl: `${providerBaseUrl}/${PATIENT}`,
    providerDoctorUrl: `${providerBaseUrl}/${PRACTITIONER}`,
    providerCoverageUrl: `${providerBaseUrl}/${COVERAGE}`,
    providerOrganizationUrl: `${providerBaseUrl}/${ORGANIZATION}`,
    providerFocusUrl: `${providerBaseUrl}/${requestTypeValue}`,
    providerLocationUrl: `${providerBaseUrl}/${LOCATION}`,
    visionPrescriptionUrl: `${providerBaseUrl}/${VISION_PRESCRIPTION}`,
    encounterUrl: `${providerBaseUrl}/${ENCOUNTER}`,
  };
};

export default createProviderUrls;
