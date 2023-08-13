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

console.log(
  await convertFileUrlToBase64(
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Y2Fyc3xlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80"
  )
);
