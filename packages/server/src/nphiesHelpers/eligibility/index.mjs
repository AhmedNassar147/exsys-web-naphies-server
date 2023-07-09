/*
 *
 * Helper: `createNaphiesEligibilityRequestFullData`.
 *
 */
import { createUUID } from "@exsys-web-server/helpers";
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesDoctorOrPatientData from "../base/createNphiesDoctorOrPatientData.mjs";
import createNphiesCoverage from "../base/createNphiesCoverage.mjs";
import createOrganizationData from "../base/createOrganizationData.mjs";
import createLocationData from "../base/createLocationData.mjs";
import createCoverageEligibilityRequest from "./createCoverageEligibilityRequest.mjs";
import { NPHIES_REQUEST_TYPES, ELIGIBILITY_TYPES } from "../../constants.mjs";

const { ELIGIBILITY } = NPHIES_REQUEST_TYPES;

const BENEFITS_AND_VALIDATION_TYPE = [
  ELIGIBILITY_TYPES.benefits,
  ELIGIBILITY_TYPES.validation,
];

const createNaphiesEligibilityRequestFullData = ({
  provider_license,
  payer_license,
  payer_child_license,
  site_url,
  site_tel,
  site_name,
  provider_organization,
  payer_organization,
  payer_name,
  provider_location,
  location_license,
  payer_base_url,
  coverage_type,
  memberid,
  patient_file_no,
  iqama_no,
  national_id_type,
  official_name,
  official_f_name,
  gender,
  birthDate,
  patient_martial_status,
  relationship,
  period_start_date,
  period_end_date,
  business_arrangement,
  network_name,
  classes,
  message_event_type,
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

  const requestId = createUUID();

  const purpose = BENEFITS_AND_VALIDATION_TYPE.includes(message_event_type)
    ? BENEFITS_AND_VALIDATION_TYPE
    : [message_event_type];

  const requestPayload = {
    ...createNphiesBaseRequestData(),
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        providerOrganizationUrl,
        requestId,
        providerFocusUrl,
        requestType: ELIGIBILITY,
      }),
      createCoverageEligibilityRequest({
        requestId,
        purpose,
        providerOrganization: provider_organization,
        payerOrganization: payer_organization,
        providerLocation: provider_location,
        periodStartDate: period_start_date,
        periodEndDate: period_end_date,
        patientId: patient_file_no,
        businessArrangement: business_arrangement,
        providerPatientUrl,
        providerOrganizationUrl,
        providerCoverageUrl,
        providerFocusUrl,
        providerLocationUrl,
      }),
      createNphiesCoverage({
        requestId,
        coverageType: coverage_type,
        memberId: memberid,
        patientId: patient_file_no,
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
        patientOrDoctorId: patient_file_no,
        identifierId: iqama_no,
        identifierIdType: national_id_type,
        staffFirstName: official_name,
        staffFamilyName: official_f_name,
        staffPhone: site_tel,
        gender,
        patientBirthdate: birthDate,
        patientMaritalStatus: patient_martial_status,
        providerDoctorOrPatientUrl: providerPatientUrl,
      }),
      createOrganizationData({
        organizationLicense: payer_child_license || payer_license,
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
