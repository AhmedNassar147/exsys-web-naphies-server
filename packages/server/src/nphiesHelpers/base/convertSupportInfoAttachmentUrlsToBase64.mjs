/*
 *
 * Helper: `convertSupportInfoAttachmentUrlsToBase64`.
 *
 */

import { isArrayHasData } from "@exsys-web-server/helpers";
import { SUPPORT_INFO_KEY_NAMES } from "../../constants.mjs";
import convertFileUrlToBase64 from "../../helpers/convertFileUrlToBase64.mjs";

// const supportInfo = [
//   {
//     value: {
//       fileUrl:
//         "https://st3.depositphotos.com/10820522/36256/i/1600/depositphotos_362566674-stock-photo-white-business-class-car-on.jpg",
//     },
//     categoryCode: "attachment",
//   },
//   {
//     value: {
//       fileUrl:
//         "https://static7.depositphotos.com/1062035/744/i/950/depositphotos_7447240-stock-photo-rear-side-view-of-car.jpg",
//     },
//     categoryCode: "sasas",
//   },
// ];

// console.log(await convertSupportInfoAttachmentUrlsToBase64(supportInfo));

const convertSupportInfoAttachmentUrlsToBase64 = async (supportInfo) => {
  if (isArrayHasData(supportInfo)) {
    return await Promise.all(
      supportInfo.map(async ({ categoryCode, ...item }) => {
        const isAttachment = categoryCode === SUPPORT_INFO_KEY_NAMES.attachment;

        const { value } = item;
        const { fileUrl, ...otherValueData } = isAttachment ? value || {} : {};

        return {
          categoryCode,
          ...item,
          value,
          ...(isAttachment
            ? {
                value: {
                  ...otherValueData,
                  data: await convertFileUrlToBase64(fileUrl),
                },
              }
            : null),
        };
      })
    );
  }

  return supportInfo;
};

export default convertSupportInfoAttachmentUrlsToBase64;
