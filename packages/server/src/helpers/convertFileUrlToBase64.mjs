/*
 *
 * Helper: `convertFileUrlToBase64`.
 *
 */
import axios from "axios";
import chalk from "chalk";
import { delayProcess, createCmdMessage } from "@exsys-web-server/helpers";

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
          const sizeMb = fileSize / 1e6;

          const skipFile = sizeMb > 10;

          if (skipFile) {
            createCmdMessage({
              type: "info",
              message: `skipping ${chalk.white.bold(
                fileUrl
              )} because size is ${chalk.red.bold(`${sizeMb} MB`)}`,
            });
          }

          resolve({
            skip: skipFile,
            data,
            notFound: !data,
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
            });
          }
        });
    };

    wrapper(5);
  });

export default convertFileUrlToBase64;
