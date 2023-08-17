/*
 *
 * Helper: `createNaphiesPreauthRequestFullData`.
 *
 */
import { isArrayHasData, createUUID } from "@exsys-web-server/helpers";
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesDoctorOrPatientData from "../base/createNphiesDoctorOrPatientData.mjs";
import createNphiesCoverage from "../base/createNphiesCoverage.mjs";
import createOrganizationData from "../base/createOrganizationData.mjs";
// import createLocationData from "../base/createLocationData.mjs";
import createNphiesClaimData from "../base/createNphiesClaimData.mjs";
import createNphiesVisionPrescriptionData from "./createNphiesVisionPrescriptionData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const { PREAUTH, CLAIM } = NPHIES_REQUEST_TYPES;

const createNaphiesPreauthRequestFullData = ({
  provider_license,
  payer_license,
  payer_child_license,
  site_url,
  site_name,
  provider_organization,
  payer_organization,
  payer_name,
  payer_base_url,
  coverage_type,
  coveragePeriodStart,
  coveragePeriodEnd,
  memberid,
  patient_file_no,
  iqama_no,
  national_id_type,
  patient_first_name,
  patient_second_name,
  patient_third_name,
  patient_family_name,
  patient_phone,
  gender,
  birthDate,
  batch_period_start,
  batch_period_end,
  // provider_location,
  // location_license,
  patient_martial_status,
  subscriber_file_no,
  subscriber_iqama_no,
  subscriber_national_id_type,
  subscriber_first_name,
  subscriber_second_name,
  subscriber_third_name,
  subscriber_family_name,
  subscriber_phone,
  subscriber_gender,
  subscriber_birthDate,
  subscriber_martial_status,
  relationship,
  network_name,
  classes,
  business_arrangement,
  message_event,
  message_event_type,
  claim_subType,
  supportInformationData,
  doctorsData,
  productsData,
  products_total_net,
  diagnosisData,
  visionPrescriptionId,
  visionPrescriptionCreatedAt,
  visionLensSpecification,
  episode_invoice_no,
  preauthRefs,
  daysSupply,
  offlineRequestDate,
  referalName,
  referalIdentifier,
  extensionPriorauthId,
}) => {
  const isClaimRequest = message_event.includes("claim-request");
  const requestType = isClaimRequest ? CLAIM : PREAUTH;

  const {
    providerPatientUrl,
    providerDoctorUrl,
    providerCoverageUrl,
    providerOrganizationUrl,
    providerFocusUrl,
    visionPrescriptionUrl,
    // providerLocationUrl,
  } = createProviderUrls({
    providerBaseUrl: site_url,
    requestType,
  });

  const baseData = createNphiesBaseRequestData();
  const hasDoctorsData = isArrayHasData(doctorsData);
  const buildVisionPrescription = !!(
    visionPrescriptionId && visionPrescriptionCreatedAt
  );

  const primaryDoctorIndex = hasDoctorsData
    ? doctorsData.findIndex(({ roleCode }) => roleCode === "primary")
    : -1;

  const isPrimaryDoctorIndexFound = primaryDoctorIndex !== -1;

  const { id: primaryDoctorId } = isPrimaryDoctorIndexFound
    ? doctorsData[primaryDoctorIndex]
    : {};

  const requestId = createUUID();

  let supportingInfo = [...(supportInformationData || [])];

  if (isArrayHasData(productsData) && isArrayHasData(daysSupply)) {
    const productsWithDaysSupplyIDs = productsData
      .map(({ days_supply_id }) => days_supply_id)
      .filter((daysSupplyValue) => typeof daysSupplyValue === "number");

    if (productsWithDaysSupplyIDs.length) {
      const filteredDaySupply = daysSupply
        .filter(({ value }) => productsWithDaysSupplyIDs.includes(value))
        .filter(Boolean);

      supportingInfo = [...supportingInfo, ...filteredDaySupply];
    }
  }

  const requestPayload = {
    ...baseData,
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        requestId,
        providerFocusUrl,
        requestType,
      }),
      createNphiesClaimData({
        requestId,
        providerOrganization: provider_organization,
        payerOrganization: payer_organization,
        patientId: patient_file_no,
        businessArrangement: business_arrangement,
        providerPatientUrl,
        providerOrganizationUrl,
        providerCoverageUrl,
        providerFocusUrl,
        siteUrl: site_url,
        visionPrescriptionUrl,
        useVisionPrescriptionUrl: buildVisionPrescription,
        hasDoctorsData,
        primaryDoctorSequence: isPrimaryDoctorIndexFound
          ? primaryDoctorIndex + 1
          : undefined,
        primaryDoctorFocal: isPrimaryDoctorIndexFound ? true : undefined,
        providerDoctorUrl,
        isClaimRequest,
        message_event_type,
        claim_subType,
        supportingInfo,
        doctorsData,
        productsData,
        productsTotalNet: products_total_net,
        diagnosisData,
        episodeInvoiceNo: episode_invoice_no,
        preauthRefs,
        batchPeriodStart: batch_period_start,
        batchPeriodEnd: batch_period_end,
        offlineRequestDate,
        referalName,
        referalIdentifier,
        extensionPriorauthId,
      }),
      createNphiesDoctorOrPatientData({
        patientOrDoctorId: patient_file_no,
        identifierId: iqama_no,
        identifierIdType: national_id_type,
        firstName: patient_first_name,
        secondName: patient_second_name,
        thirdName: patient_third_name,
        familyName: patient_family_name,
        staffPhone: patient_phone,
        gender,
        patientBirthdate: birthDate,
        patientMaritalStatus: patient_martial_status,
        providerDoctorOrPatientUrl: providerPatientUrl,
      }),
      createNphiesCoverage({
        requestId,
        coverageType: coverage_type,
        memberId: memberid,
        patientId: patient_file_no,
        subscriberPatientId: subscriber_file_no,
        relationship,
        payerOrganization: payer_organization,
        payerBaseUrl: payer_base_url,
        providerOrganizationUrl,
        providerPatientUrl,
        providerCoverageUrl,
        networkName: network_name,
        classes,
        coveragePeriodStart,
        coveragePeriodEnd,
      }),
      ...(hasDoctorsData
        ? doctorsData.map(
            ({
              id,
              license,
              first_name,
              second_name,
              third_name,
              family_name,
            }) =>
              createNphiesDoctorOrPatientData({
                patientOrDoctorId: id,
                identifierId: license,
                // identifierIdType: "MD",
                firstName: first_name,
                secondName: second_name,
                thirdName: third_name,
                familyName: family_name,
                providerDoctorOrPatientUrl: providerDoctorUrl,
                isPatient: false,
              })
          )
        : []),
      !!subscriber_file_no &&
        !!subscriber_iqama_no &&
        createNphiesDoctorOrPatientData({
          patientOrDoctorId: subscriber_file_no,
          identifierId: subscriber_iqama_no,
          identifierIdType: subscriber_national_id_type,
          firstName: subscriber_first_name,
          secondName: subscriber_second_name,
          thirdName: subscriber_third_name,
          familyName: subscriber_family_name,
          staffPhone: subscriber_phone,
          gender: subscriber_gender,
          patientBirthdate: subscriber_birthDate,
          patientMaritalStatus: subscriber_martial_status,
          providerDoctorOrPatientUrl: providerPatientUrl,
        }),
      buildVisionPrescription &&
        createNphiesVisionPrescriptionData({
          visionPrescriptionUrl,
          visionPrescriptionId,
          visionPrescriptionCreatedAt,
          visionLensSpecification,
          requestId,
          providerDoctorUrl,
          providerPatientUrl,
          doctorId: primaryDoctorId,
          dateWritten: baseData.timestamp,
          patientId: patient_file_no,
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
      // createLocationData({
      //   locationLicense: location_license,
      //   siteName: site_name,
      //   providerLocation: provider_location,
      //   providerOrganization: provider_organization,
      //   providerLocationUrl,
      //   providerOrganizationUrl,
      // }),
    ].filter(Boolean),
  };

  return requestPayload;
};

export default createNaphiesPreauthRequestFullData;
