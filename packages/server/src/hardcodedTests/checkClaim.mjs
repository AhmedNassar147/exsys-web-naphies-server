/*
 *
 * `checkClaim`: `hardcodedTests`.
 *
 */
import { delayProcess, isArrayHasData } from "@exsys-web-server/helpers";
import stopTheProcessIfCertificateNotFound from "../helpers/stopTheProcessIfCertificateNotFound.mjs";
import fetchExsysPreauthorizationDataAndCallNphies from "../exsysHelpers/fetchExsysPreauthorizationDataAndCallNphies.mjs";
import { SERVER_CONFIG, NPHIES_REQUEST_TYPES } from "../constants.mjs";

const { claimTestData, authorization, organizationNo } = SERVER_CONFIG;
const DELAY_TIME = 2 * 60 * 1000;

(async () => {
  await stopTheProcessIfCertificateNotFound();
  const canRunTest = isArrayHasData(claimTestData);

  if (!canRunTest) {
    console.log(
      `you need to configure \`claimTestData\` in \`config.json\` file`
    );
    return;
  }

  const requestParamsArray = claimTestData.map(
    ({ patientFileNo, episodeNo, episodeInvoiceNo }) => ({
      authorization: authorization,
      organization_no: organizationNo,
      patient_file_no: patientFileNo,
      episode_no: episodeNo,
      episode_invoice_no: episodeInvoiceNo,
    })
  );

  const length = requestParamsArray.length;
  const lastIndex = length - 1;

  const configPromises = requestParamsArray
    .map((requestParams, index) =>
      [
        fetchExsysPreauthorizationDataAndCallNphies({
          requestMethod: "GET",
          requestParams,
          nphiesRequestType: NPHIES_REQUEST_TYPES.CLAIM,
        }),
        index < lastIndex ? delayProcess(DELAY_TIME) : false,
      ].filter(Boolean)
    )
    .flat();

  await Promise.all(configPromises);
})();
