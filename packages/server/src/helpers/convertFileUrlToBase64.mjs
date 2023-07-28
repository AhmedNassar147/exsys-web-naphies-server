/*
 *
 * Helper: `convertFileUrlToBase64`.
 *
 */
import axios from "axios";
import { delayProcess } from "@exsys-web-server/helpers";

const convertFileUrlToBase64 = async (fileUrl, removeBaseData) =>
  await new Promise(async (resolve) => {
    const wrapper = (n) => {
      axios
        .get(fileUrl, {
          responseType: "arraybuffer",
        })
        .then(({ data }) => {
          let fileBase64 = Buffer.from(data).toString("base64");

          if (removeBaseData && fileBase64) {
            fileBase64 = fileBase64.replace(/.+base64,/, "");
          }

          return resolve(fileBase64);
        })
        .catch(async (error) => {
          const { response } = error || {};
          const { status } = response || {};
          const isNotFoundUrl = status === 404;

          if (n > 0 && typeof status === "undefined") {
            await delayProcess(1100);
            wrapper(--n);
          } else {
            resolve(!isNotFoundUrl);
          }
        });
    };

    wrapper(7);
  });

export default convertFileUrlToBase64;
