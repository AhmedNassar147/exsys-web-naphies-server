/*
 *
 * Helpers: `createLocationData`.
 *
 */
import createNphiesBaseResource from "../base/createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { PROFILE_LOCATION } = NPHIES_BASE_PROFILE_TYPES;
const { LOCATION } = NPHIES_RESOURCE_TYPES;
const { BASE_TERMINOLOGY_CODE_SYS_URL, LOCATION_LICENSE_URL } = NPHIES_API_URLS;
const { ROLE_CODE } = NPHIES_BASE_CODE_TYPES;

const locationSystemTypeUrl = `${BASE_TERMINOLOGY_CODE_SYS_URL}/${ROLE_CODE}`;

const createLocationData = ({
  locationLicense,
  siteName,
  providerLocation,
  providerOrganization,
  providerLocationUrl,
  providerOrganizationUrl,
}) => ({
  fullUrl: `${providerLocationUrl}/${providerLocation}`,
  resource: {
    ...createNphiesBaseResource({
      resourceType: LOCATION,
      profileType: PROFILE_LOCATION,
      uuid: providerLocation,
    }),
    identifier: [
      {
        system: LOCATION_LICENSE_URL,
        value: locationLicense,
      },
    ],
    status: "active",
    name: siteName,
    type: [
      {
        coding: [
          {
            system: locationSystemTypeUrl,
            code: locationLicense,
          },
        ],
      },
    ],
    managingOrganization: {
      reference: `${providerOrganizationUrl}/${providerOrganization}`,
    },
  },
});

export default createLocationData;
