/*
 *
 * Helpers: `createOrganizationData`.
 *
 */
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import {
  NPHIES_BASE_PROFILE_TYPES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_API_URLS,
  NPHIES_BASE_CODE_TYPES,
} from "../../constants.mjs";

const { PROVIDER_ORGANIZATION, INSURER_ORGANIZATION } =
  NPHIES_BASE_PROFILE_TYPES;
const { ORGANIZATION } = NPHIES_RESOURCE_TYPES;
const { BASE_CODE_SYS_URL, PROVIDER_LICENSE_URL, PAYER_LICENSE_URL } =
  NPHIES_API_URLS;
const { ORGANIZATION_TYPE } = NPHIES_BASE_CODE_TYPES;

const createOrganizationData = ({
  organizationLicense,
  organizationReference,
  siteName,
  isProvider,
  providerOrganizationUrl,
}) => ({
  fullUrl: `${providerOrganizationUrl}/${organizationReference}`,
  resource: {
    ...createNphiesBaseResource({
      resourceType: ORGANIZATION,
      profileType: isProvider ? PROVIDER_ORGANIZATION : INSURER_ORGANIZATION,
      uuid: organizationReference,
    }),
    identifier: [
      {
        system: isProvider ? PROVIDER_LICENSE_URL : PAYER_LICENSE_URL,
        value: organizationLicense,
      },
    ],
    active: true,
    type: [
      {
        coding: [
          {
            system: `${BASE_CODE_SYS_URL}/${ORGANIZATION_TYPE}`,
            code: isProvider ? "prov" : "ins",
          },
        ],
      },
    ],
    name: siteName,
  },
});

export default createOrganizationData;
