/*
 *
 * Helper: `getRemoteFilePathData`.
 *
 */
import delayProcess from "./delayProcess.mjs";
import axios from "axios";

const getRemoteFilePathData = async (fileUrl, retryTimes = 0) =>
  await new Promise(async (resolve) => {
    const wrapper = (n) => {
      axios
        .get(fileUrl, {
          responseType: "arrayBuffer",
          responseEncoding: "base64",
        })
        .then(({ data, headers }) => {
          const fileSize = headers["content-length"];
          const sizeMb = fileSize / 1e6;

          const skipFile = sizeMb > 10;

          resolve({
            skip: skipFile,
            data,
            notFound: !data,
            sizeMb,
          });
        })
        .catch(async (error) => {
          const { response } = error || {};
          const { status } = response || {};

          if (n > 0 && typeof status === "undefined") {
            await delayProcess(1000);
            wrapper(--n);
          } else {
            resolve({
              notFound: status === 404,
              sizeMb: 0,
            });
          }
        });
    };

    wrapper(retryTimes);
  });

export default getRemoteFilePathData;
