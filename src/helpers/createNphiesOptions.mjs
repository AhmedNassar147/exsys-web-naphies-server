/*
 *
 * Helper: `createNphiesOptions`.
 *
 */
import { readFile } from "fs/promises";
import https from "https";

const createNphiesOptions = async ({ certificatePath, ignoreCert }) => {
  const certificate = ignoreCert ? undefined : await readFile(certificatePath);

  const requestOptions = {
    headers: {
      "Content-type": "application/fhir+json",
    },
    httpsAgent: new https.Agent({
      pfx: certificate,
      passphrase: "qLFCpUS8CF_c",
    }),
  };

  return requestOptions;
};

export default createNphiesOptions;
