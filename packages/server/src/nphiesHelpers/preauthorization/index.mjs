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
import createAllOrganizationEntries from "../base/createAllOrganizationEntries.mjs";
// import createLocationData from "../base/createLocationData.mjs";
import createNphiesClaimData from "../base/createNphiesClaimData.mjs";
import createNphiesEncounter from "../base/createNphiesEncounter.mjs";
import createMedicationRequestEntry from "../base/createMedicationRequestEntry.mjs";
import createNphiesVisionPrescriptionData from "./createNphiesVisionPrescriptionData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const { PREAUTH, CLAIM, PRESCRIBER } = NPHIES_REQUEST_TYPES;

// message_event_type: "vision"
// visionPrescriptionId,
// visionPrescriptionCreatedAt,
// visionLensSpecification: [
//   {
//     "eye": "left",
//     "sphere": 1.5,
//     "cylinder": 0.75,
//     "axis": 110,
//     prism: [
//       {
//         amount: 10,
//         base: 5
//       }
//     ]
//   },
//   {
//     "eye": "right",
//     "sphere": 2.25,
//     "cylinder": 0.75,
//     "axis": 80
//   }
// ]

const createNaphiesPreauthRequestFullData = ({
  provider_license,
  payer_license,
  payer_child_license,
  // site_url,
  relatedSystemBaseUrl = "https://Interop.motalabatech.ai",
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
  patient_nationality_code,
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
  batch_accounting_period,
  patient_martial_status,
  relationship,
  subscriber_file_no,
  subscriber_occupationCode,
  subscriber_religion,
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
  network_name,
  occupationCode,
  religion,
  className,
  classPolicyNo,
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
  relatedParentClaimIdentifier,
  relatedRelationshipCode,
  transfer_to_other_provider,
  billablePeriodStartDate,
  billablePeriodEndDate,
  providerTypeCode,
  providerTypeDisplay,
  policyHolderLicense,
  policyHolderName,
  policyHolderReference,
  accidentDate,
  accidentCode,
  encounterServiceEventType,
  encounterRequestId,
  encounterStatus,
  encounterClassCode,
  encounterClassDisplay,
  encounterServiceType,
  encounterPeriodStart,
  encounterPeriodEnd,
  encounterAdmissionSpecialtyCode,
  encounterAdmissionSpecialtyDisplay,
  encounterAdmitSourceCode,
  encounterAdmitSourceDisplay,
  encounterArrivalCode,
  encounterArrivalDisplay,
  encounterEmergencyServiceStartDate,
  encounterEmergencyDispositionCode,
  encounterEmergencyDispositionDisplay,
  encounterTriageCategoryCode,
  encounterTriageCategoryDisplay,
  encounterTriageDate,
  encounterCauseOfDeathCode,
  encounterCauseOfDeathDisplay,
  extensionDischargeSpecialtyCode,
  extensionDischargeSpecialtyDisplay,
  extensionIntendedLengthOfStayCode,
  extensionIntendedLengthOfStayDisplay,
  dischargeDispositionCode,
  dischargeDispositionDisplay,
  encounterReAdmissionCode,
  encounterReAdmissionDisplay,
  encounterReAdmissionSystemUrl,
  approvalPrescriptionId,
}) => {
  const site_url = "https://Interop.motalabatech.ai";
  const isClaimRequest = message_event.includes("claim-request");
  const isPrescriberRequestData = message_event.includes(PRESCRIBER);

  const requestType =
    isClaimRequest || isPrescriberRequestData ? CLAIM : PREAUTH;

  const requestId = createUUID();

  const {
    providerPatientUrl,
    providerDoctorUrl,
    providerCoverageUrl,
    providerOrganizationUrl,
    providerFocusUrl,
    visionPrescriptionUrl,
    encounterUrl,
    medicationRequestUrl,
  } = createProviderUrls({
    providerBaseUrl: site_url,
    requestType,
  });

  const hasDoctorsData = isArrayHasData(doctorsData);

  const shouldBuildVisionPrescription =
    !isPrescriberRequestData &&
    !!(visionPrescriptionId && visionPrescriptionCreatedAt);

  const primaryDoctorIndex = hasDoctorsData
    ? doctorsData.findIndex(({ roleCode }) => roleCode === "primary")
    : -1;

  const isPrimaryDoctorIndexFound = primaryDoctorIndex !== -1;

  const { id: primaryDoctorId } = isPrimaryDoctorIndexFound
    ? doctorsData[primaryDoctorIndex]
    : {};

  const hasProductsData = isArrayHasData(productsData);

  let supportingInfo = [...(supportInformationData || [])];

  if (hasProductsData && isArrayHasData(daysSupply)) {
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

  const hasEncounterSection = !!encounterRequestId;

  const fullEncounterUrl = hasEncounterSection
    ? `${encounterUrl}/${encounterRequestId}`
    : undefined;

  const medicationRequestIds =
    isPrescriberRequestData && hasProductsData
      ? productsData.map(() => createUUID())
      : [];

  const requestPayload = {
    ...createNphiesBaseRequestData(),
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        requestId,
        providerFocusUrl,
        requestType: isPrescriberRequestData ? PRESCRIBER : requestType,
      }),
      createNphiesClaimData({
        requestId,
        isPrescriberRequestData,
        approvalPrescriptionId,
        medicationRequestUrl,
        medicationRequestIds,
        providerOrganization: provider_organization,
        payerOrganization: payer_organization,
        patientId: patient_file_no,
        businessArrangement: business_arrangement,
        providerPatientUrl,
        providerOrganizationUrl,
        providerCoverageUrl,
        providerFocusUrl,
        siteUrl: site_url,
        relatedSystemBaseUrl,
        visionPrescriptionUrl,
        useVisionPrescriptionUrl: shouldBuildVisionPrescription,
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
        batchAccountingPeriod: batch_accounting_period,
        offlineRequestDate,
        referalName,
        referalIdentifier,
        extensionPriorauthId,
        relatedParentClaimIdentifier,
        relatedRelationshipCode,
        isTransfer: transfer_to_other_provider === "Y",
        billablePeriodEndDate,
        billablePeriodStartDate,
        accidentDate,
        accidentCode,
        encounterUrl: fullEncounterUrl,
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
        nationalityCode: patient_nationality_code,
        occupationCode,
        religion,
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
        className,
        classPolicyNo,
        coveragePeriodStart,
        coveragePeriodEnd,
        policyHolderReference,
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
          occupationCode: subscriber_occupationCode,
          religion: subscriber_religion,
        }),
      shouldBuildVisionPrescription &&
        createNphiesVisionPrescriptionData({
          visionPrescriptionUrl,
          visionPrescriptionId,
          visionPrescriptionCreatedAt,
          visionLensSpecification,
          requestId,
          providerDoctorUrl,
          providerPatientUrl,
          doctorId: primaryDoctorId,
          patientId: patient_file_no,
        }),
      hasEncounterSection &&
        createNphiesEncounter({
          requestId: encounterRequestId,
          encounterUrl,
          encounterServiceEventType,
          encounterStatus,
          encounterClassCode,
          encounterClassDisplay,
          encounterServiceType,
          encounterPeriodStart,
          encounterPeriodEnd,
          encounterAdmissionSpecialtyCode,
          encounterAdmissionSpecialtyDisplay,
          encounterAdmitSourceCode,
          encounterAdmitSourceDisplay,
          encounterArrivalCode,
          encounterArrivalDisplay,
          encounterEmergencyServiceStartDate,
          encounterEmergencyDispositionCode,
          encounterEmergencyDispositionDisplay,
          encounterTriageCategoryCode,
          encounterTriageCategoryDisplay,
          encounterTriageDate,
          encounterCauseOfDeathCode,
          encounterCauseOfDeathDisplay,
          extensionDischargeSpecialtyCode,
          extensionDischargeSpecialtyDisplay,
          extensionIntendedLengthOfStayCode,
          extensionIntendedLengthOfStayDisplay,
          dischargeDispositionCode,
          dischargeDispositionDisplay,
          encounterReAdmissionCode,
          encounterReAdmissionDisplay,
          encounterReAdmissionSystemUrl,
          providerPatientUrl,
          patientFileNo: patient_file_no,
          organizationReference: provider_organization,
          providerOrganizationUrl,
        }),
      ...createAllOrganizationEntries({
        organizationLicense: provider_license,
        organizationReference: provider_organization,
        siteName: site_name,
        providerOrganizationUrl,
        providerTypeCode,
        providerTypeDisplay,
        payerLicense: payer_child_license || payer_license,
        payerReference: payer_organization,
        payerName: payer_name,
        policyHolderLicense,
        policyHolderName,
        policyHolderReference,
      }),
      ...(!!(isPrescriberRequestData && hasProductsData)
        ? productsData.map((product, index) =>
            createMedicationRequestEntry({
              medicationRequestUrl,
              providerPatientUrl,
              providerDoctorUrl,
              medicationRequestId: medicationRequestIds[index],
              patientId: patient_file_no,
              primaryDoctorId,
              product,
            })
          )
        : []),
    ].filter(Boolean),
  };

  return requestPayload;
};

export default createNaphiesPreauthRequestFullData;
