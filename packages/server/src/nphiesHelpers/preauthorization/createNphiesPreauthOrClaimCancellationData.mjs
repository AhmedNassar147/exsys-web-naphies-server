/*
 *
 * Helper: `createNphiesPreauthOrClaimCancellationData`.
 *
 */
import { createUUID, writeResultFile } from "@exsys-web-server/helpers";
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesTaskData from "../base/createNphiesTaskData.mjs";
import createOrganizationData from "../base/createOrganizationData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const { CANCEL } = NPHIES_REQUEST_TYPES;

const createNphiesPreauthOrClaimCancellationData = ({
  site_url,
  site_name,
  provider_license,
  provider_organization,
  payer_organization,
  payer_license,
  payer_child_license,
  payer_name,
  cancellation_request_id,
  cancellation_reason_code,
}) => {
  const requestId = createUUID();

  const { providerOrganizationUrl, providerFocusUrl } = createProviderUrls({
    providerBaseUrl: site_url,
    requestType: CANCEL,
  });

  return {
    ...createNphiesBaseRequestData(),
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        requestId,
        providerFocusUrl,
        requestType: CANCEL,
      }),
      createNphiesTaskData({
        providerOrganization: provider_organization,
        requestId,
        providerFocusUrl,
        requestType: CANCEL,
        payerOrganization: payer_organization,
        siteUrl: site_url,
        cancellationRequestId: cancellation_request_id,
        cancellationReasonCode: cancellation_reason_code,
      }),
      createOrganizationData({
        organizationLicense: provider_license,
        organizationReference: provider_organization,
        siteName: site_name,
        providerOrganizationUrl,
        isProvider: true,
      }),
      createOrganizationData({
        organizationLicense: payer_child_license || payer_license,
        organizationReference: payer_organization,
        siteName: payer_name,
        providerOrganizationUrl,
      }),
    ],
  };
};

export default createNphiesPreauthOrClaimCancellationData;
