/*
 *
 * Helper: `convertSentAttachmentBase64ToFileUrl`.
 *
 */
import { isArrayHasData, isObjectHasData } from "@exsys-web-server/helpers";
import extractContentAttachment from "../extraction/extractContentAttachment.mjs";

const attachmentKeyToItemKey = {
  supportingInfo: "valueAttachment",
  payload: "contentAttachment",
};

const convertItemEntry = (attachmentKey) => (entry) => {
  if (entry) {
    const { resource, ...otherEntryData } = entry;

    const { [attachmentKey]: attachmentKeyValue, ...otherResourceValues } =
      resource;

    const searchKeyName = attachmentKeyToItemKey[attachmentKey];

    if (isArrayHasData(attachmentKeyValue)) {
      return {
        ...otherEntryData,
        resource: {
          ...otherResourceValues,
          [attachmentKey]: attachmentKeyValue.map(
            ({ [searchKeyName]: attachmentValue, ...rest }) => {
              return {
                ...rest,
                ...(attachmentValue
                  ? {
                      [searchKeyName]: extractContentAttachment(
                        attachmentValue,
                        true
                      ),
                    }
                  : null),
              };
            }
          ),
        },
      };
    }
  }

  return entry;
};

const convertSentAttachmentBase64ToFileUrl = (groupedNphiesRequestEntries) => {
  if (
    !groupedNphiesRequestEntries ||
    !isObjectHasData(groupedNphiesRequestEntries)
  ) {
    return groupedNphiesRequestEntries;
  }

  const { Claim, Communication, ...otherItem } = groupedNphiesRequestEntries;

  return {
    ...otherItem,
    Claim: Claim ? Claim.map(convertItemEntry("supportingInfo")) : undefined,

    Communication: Communication
      ? Communication.map(convertItemEntry("payload"))
      : undefined,
  };
};

export default convertSentAttachmentBase64ToFileUrl;
