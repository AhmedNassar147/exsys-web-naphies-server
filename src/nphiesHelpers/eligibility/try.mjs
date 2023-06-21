import fetchExsysEligibilityDataAndCallNphies from "../../exsysHelpers/fetchExsysEligibilityDataAndCallNphies.mjs";

const exsysAPiBodyData = {
  authorization: 5361687,
  message_event: "eligibility",
  message_event_type: "validation",
  organization_no: "001",
  patient_file_no: "115765",
  memberid: "1116201086",
  contract_no: 16529,
};

await fetchExsysEligibilityDataAndCallNphies({
  exsysAPiBodyData,
});
