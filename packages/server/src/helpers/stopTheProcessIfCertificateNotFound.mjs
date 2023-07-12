/*
 *
 * Helper: `stopTheProcessIfCertificateNotFound`.
 *
 */
import { checkPathExists } from "@exsys-web-server/helpers";
import { NPHIES_CERT_FILE_NAME, CLI_CONFIG } from "../constants.mjs";

const { ignoreCert } = CLI_CONFIG;

const stopTheProcessIfCertificateNotFound = async (showCheckingLog = true) => {
  if (showCheckingLog) {
    console.info("checking certificate ...");
  }

  if (!ignoreCert && !(await checkPathExists(NPHIES_CERT_FILE_NAME))) {
    console.error(
      `can't find the certificate where the path is ${NPHIES_CERT_FILE_NAME}`
    );

    // console.log(`restarting server after ${RESTART_SERVER_MS / 1000} seconds`);
    // restartProcess();
    process.kill(process.pid);
  }
};

export default stopTheProcessIfCertificateNotFound;
