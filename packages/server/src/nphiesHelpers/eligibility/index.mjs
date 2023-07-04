/*
 *
 * Helper: `createNaphiesEligibilityRequestFullData`.
 *
 */
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesDoctorOrPatientData from "../base/createNphiesDoctorOrPatientData.mjs";
import createNphiesCoverage from "../base/createNphiesCoverage.mjs";
import createOrganizationData from "../base/createOrganizationData.mjs";
import createCoverageEligibilityRequest from "./createCoverageEligibilityRequest.mjs";
import createLocationData from "./createLocationData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const { ELIGIBILITY } = NPHIES_REQUEST_TYPES;

const createNaphiesEligibilityRequestFullData = ({
  provider_license,
  request_id,
  payer_license,
  site_url,
  site_tel,
  site_name,
  provider_organization,
  payer_organization,
  payer_name,
  provider_location,
  location_license,
  payer_base_url,
  purpose,
  coverage_type,
  member_id,
  patient_id,
  national_id,
  national_id_type,
  staff_first_name,
  staff_family_name,
  gender,
  birthDate,
  patient_martial_status,
  relationship,
  period_start_date,
  period_end_date,
  business_arrangement,
  network_name,
  classes,
}) => {
  const {
    providerPatientUrl,
    providerCoverageUrl,
    providerOrganizationUrl,
    providerFocusUrl,
    providerLocationUrl,
  } = createProviderUrls({
    providerBaseUrl: site_url,
    requestType: ELIGIBILITY,
  });

  const requestPayload = {
    ...createNphiesBaseRequestData(),
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        payerOrganization: payer_organization,
        providerOrganizationUrl,
        requestId: request_id,
        providerFocusUrl,
        requestType: ELIGIBILITY,
      }),
      createCoverageEligibilityRequest({
        requestId: request_id,
        purpose,
        providerOrganization: provider_organization,
        payerOrganization: payer_organization,
        providerLocation: provider_location,
        periodStartDate: period_start_date,
        periodEndDate: period_end_date,
        patientId: patient_id,
        businessArrangement: business_arrangement,
        providerPatientUrl,
        providerOrganizationUrl,
        providerCoverageUrl,
        providerFocusUrl,
        providerLocationUrl,
      }),
      createNphiesCoverage({
        requestId: request_id,
        coverageType: coverage_type,
        memberId: member_id,
        patientId: patient_id,
        relationship,
        payerOrganization: payer_organization,
        payerBaseUrl: payer_base_url,
        providerOrganizationUrl,
        providerPatientUrl,
        providerCoverageUrl,
        networkName: network_name,
        classes,
      }),
      createOrganizationData({
        organizationLicense: provider_license,
        organizationReference: provider_organization,
        siteName: site_name,
        providerOrganizationUrl,
        isProvider: true,
      }),
      createNphiesDoctorOrPatientData({
        patientOrDoctorId: patient_id,
        identifierId: national_id,
        identifierIdType: national_id_type,
        staffFirstName: staff_first_name,
        staffFamilyName: staff_family_name,
        staffPhone: site_tel,
        gender,
        patientBirthdate: birthDate,
        patientMaritalStatus: patient_martial_status,
        providerDoctorOrPatientUrl: providerPatientUrl,
      }),
      createOrganizationData({
        organizationLicense: payer_license,
        organizationReference: payer_organization,
        siteName: payer_name,
        providerOrganizationUrl,
      }),
      createLocationData({
        locationLicense: location_license,
        siteName: site_name,
        providerLocation: provider_location,
        providerOrganization: provider_organization,
        providerLocationUrl,
        providerOrganizationUrl,
      }),
    ].filter(Boolean),
  };

  return requestPayload;
};

export default createNaphiesEligibilityRequestFullData;
