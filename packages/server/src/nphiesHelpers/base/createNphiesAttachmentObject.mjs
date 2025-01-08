/*
 *
 * helper: `createNphiesAttachmentObject`.
 *
 */
import { reverseDate } from "@exsys-web-server/helpers";
import { ATTACHMENT_ANCHOR } from "../../constants.mjs";
import removeInvisibleCharactersFromString from "../../helpers/removeInvisibleCharactersFromString.mjs";

const createNphiesAttachmentObject = ({
  value,
  contentType,
  title,
  creation,
  fileUrl,
}) => {
  let _title = title || "";

  if (contentType) {
    _title += ` ${contentType.replace("/", ".")}`;
  }

  _title = removeInvisibleCharactersFromString(_title);

  if (fileUrl) {
    _title += ` ${ATTACHMENT_ANCHOR}${encodeURIComponent(fileUrl)}`;
  }

  return {
    title: _title,
    creation: reverseDate(creation),
    contentType,
    data: value,
  };
};

export default createNphiesAttachmentObject;
