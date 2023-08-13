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
          responseType: "arrayBuffer",
          responseEncoding: "base64",
        })
        .then(({ data, headers }) => {
          const fileSize = headers["content-length"];
          const sizeMb = fileSize / (1024 * 1024);

          resolve({
            skip: sizeMb > 10,
            data,
            notFound: false,
          });
        })
        .catch(async (error) => {
          const { response } = error || {};
          const { status } = response || {};
          const isNotFoundUrl = status === 404;

          if (n > 0 && typeof status === "undefined") {
            await delayProcess(1000);
            wrapper(--n);
          } else {
            resolve({
              notFound: isNotFoundUrl,
            });
          }
        });
    };

    wrapper(5);
  });

export default convertFileUrlToBase64;
