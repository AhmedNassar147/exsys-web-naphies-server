/*
 *
 * Helper: `extractContentAttachment`.
 *
 */
import {
  ATTACHMENT_ANCHOR,
  ATTACHMENT_ANCHOR_REGEX,
} from "../../constants.mjs";

const extractContentAttachment = (valueAttachment, appendFileUrlIfFound) => {
  let value;
  let title;
  let contentType;
  let creation;

  if (valueAttachment) {
    const {
      contentType: _contentType,
      data,
      title: _title,
      creation: _creation,
    } = valueAttachment;

    if (!!data && typeof data === "string") {
      value = data.startsWith("http:")
        ? data
        : `data:${_contentType};base64,${data}`;
    }

    contentType = _contentType;
    title = _title;
    creation = _creation;

    if (appendFileUrlIfFound && title && title.includes(ATTACHMENT_ANCHOR)) {
      const [fileUrl] = title.match(ATTACHMENT_ANCHOR_REGEX) || [];
      title = title.replace(ATTACHMENT_ANCHOR_REGEX, "");

      if (fileUrl) {
        value = decodeURIComponent(fileUrl.replace(ATTACHMENT_ANCHOR, ""));
      }
    }
  }

  return {
    value,
    title,
    contentType,
    creation,
  };
};

export default extractContentAttachment;

// console.log(
//   extractContentAttachment(
//     {
//       title:
//         "application.pdf _FILE_URL_http%3A%2F%2F192.168.15.245%3A9090%2Fi%2Fexsys%2FnphiesSupportingInfo%2FS00124_02367%2F2180175198_024317_I00124-47792.pdf",
//       creation: "2024-12-10",
//       contentType: "image/jpeg",
//       data: "ANCMSJMC",
//     },
//     true
//   )
// );
