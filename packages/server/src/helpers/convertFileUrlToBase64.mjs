/*
 *
 * Helper: `convertFileUrlToBase64`.
 *
 */
import axios from "axios";
import { delayProcess } from "@exsys-web-server/helpers";

const convertFileUrlToBase64 = async (fileUrl) =>
  await new Promise(async (resolve) => {
    const wrapper = (n) => {
      axios
        .get(fileUrl, {
          responseType: "text",
          responseEncoding: "base64",
        })
        .then(({ data }) => resolve(data))
        .catch(async (error) => {
          const { response } = error || {};
          const { status } = response || {};
          const isNotFoundUrl = status === 404;

          if (n > 0 && typeof status === "undefined") {
            await delayProcess(1000);
            wrapper(--n);
          } else {
            resolve(!isNotFoundUrl);
          }
        });
    };

    wrapper(5);
  });

export default convertFileUrlToBase64;
