/*
 *
 * Helper: `createNphiesPreauthOrClaimPollData`.
 *
 */
import { createUUID } from "@exsys-web-server/helpers";
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesTaskData from "../base/createNphiesTaskData.mjs";
import createOrganizationData from "../base/createOrganizationData.mjs";
import {
  NPHIES_REQUEST_TYPES,
  ORGANIZATION_SECTION_TYPES,
} from "../../constants.mjs";

const { POLL } = NPHIES_REQUEST_TYPES;

const createNphiesPreauthOrClaimPollData = ({
  providerLicense,
  providerOrganization,
  messagesCount,
  siteUrl,
  siteName,
  includeMessageType,
  excludeMessageType,
  providerTypeCode,
  providerTypeDisplay,
}) => {
  const requestId = createUUID();

  const { providerOrganizationUrl, providerFocusUrl } = createProviderUrls({
    providerBaseUrl: siteUrl,
    requestType: POLL,
  });

  return {
    ...createNphiesBaseRequestData(),
    entry: [
      createNphiesMessageHeader({
        providerLicense,
        requestId,
        providerFocusUrl,
        requestType: POLL,
      }),
      createNphiesTaskData({
        providerOrganization,
        requestId,
        providerFocusUrl,
        requestType: POLL,
        messagesCount,
        includeMessageType,
        excludeMessageType,
      }),
      createOrganizationData({
        organizationLicense: providerLicense,
        organizationReference: providerOrganization,
        siteName,
        providerOrganizationUrl,
        organizationType: ORGANIZATION_SECTION_TYPES.P,
        providerTypeCode,
        providerTypeDisplay,
      }),
    ],
  };
};

export default createNphiesPreauthOrClaimPollData;
