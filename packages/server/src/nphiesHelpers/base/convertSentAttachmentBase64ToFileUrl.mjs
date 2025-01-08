/*
 *
 * Helper: `convertSentAttachmentBase64ToFileUrl`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractContentAttachment from "../extraction/extractContentAttachment.mjs";

const attachmentKeyToItemKey = {
  supportingInfo: "valueAttachment",
  payload: "contentAttachment",
};

const convertItemEntry = (entry, attachmentKey) => {
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

const convertSentAttachmentBase64ToFileUrl = (nodeServerDataSentToNaphies) => {
  const { entry: requestEntries, ...otherData } =
    nodeServerDataSentToNaphies || {};

  if (isArrayHasData(requestEntries)) {
    return {
      ...otherData,
      entry: requestEntries.map((entry) => {
        const { resource } = entry || {};
        const { resourceType } = resource || {};

        if (resourceType === "Claim") {
          return convertItemEntry(entry, "supportingInfo");
        }

        if (resourceType === "Communication") {
          return convertItemEntry(entry, "payload");
        }

        return entry;
      }),
    };
  }

  return nodeServerDataSentToNaphies;
};

export default convertSentAttachmentBase64ToFileUrl;
