/*
 *
 * `checkEligibility`: `hardcodedTests`.
 *
 */
import { delayProcess, isArrayHasData } from "@exsys-web-server/helpers";
import fetchExsysEligibilityDataAndCallNphies from "../exsysHelpers/fetchExsysEligibilityDataAndCallNphies.mjs";
import { SERVER_CONFIG, EXSYS_POLLS_TIMEOUT } from "../constants.mjs";

const { patients, authorization, organizationNo } = SERVER_CONFIG;

(async () => {
  const canRunTest = isArrayHasData(patients);

  if (!canRunTest) {
    console.log(`you need to configure patients in \`config.json\` file`);
    return;
  }

  const exsysAPiBodyDataArray = patients.map(
    ({ patientFileNo, memberId, contractNo }) => ({
      message_event: "eligibility",
      message_event_type: "validation",
      authorization: authorization,
      organization_no: organizationNo,
      patient_file_no: patientFileNo,
      memberid: memberId,
      contract_no: contractNo,
    })
  );

  const length = exsysAPiBodyDataArray.length;
  const lastIndex = length - 1;

  const configPromises = exsysAPiBodyDataArray
    .map((exsysAPiBodyData, index) =>
      [
        fetchExsysEligibilityDataAndCallNphies({
          exsysAPiBodyData,
        }),
        index < lastIndex ? delayProcess(EXSYS_POLLS_TIMEOUT) : false,
      ].filter(Boolean)
    )
    .flat();

  await Promise.all(configPromises);
})();
