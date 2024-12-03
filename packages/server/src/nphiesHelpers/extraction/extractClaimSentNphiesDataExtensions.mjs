/*
 *
 * Helper: `extractClaimSentNphiesDataExtensions`
 *
 */
import {
  formatDateToNativeDateParts,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import { NPHIES_BASE_CODE_TYPES } from "../../constants.mjs";
import getValueFromObject from "./getValueFromObject.mjs";

const {
  EXTENSION_AUTH_OFFLINE_DATE,
  EXTENSION_AUTH_ONLINE_RESPONSE,
  EXTENSION_EPISODE,
  EXT_PERIOD_START,
  EXT_ACCOUNT_PERIOD,
  EXTENSION_TRANSFER,
} = NPHIES_BASE_CODE_TYPES;

const formatDate = (date) =>
  formatDateToNativeDateParts(date, {
    stringifyReturnedDate: true,
  });

const extractClaimSentNphiesDataExtensions = (extension) => {
  if (isArrayHasData(extension)) {
    return extension.reduce(
      (
        acc,
        {
          url,
          valueDateTime,
          valueReference,
          valueIdentifier,
          valuePeriod,
          valueBoolean,
          valueDate,
        }
      ) => {
        if (url.includes(EXTENSION_AUTH_OFFLINE_DATE)) {
          acc.offlineRequestDate = formatDate(valueDateTime);
        }

        if (url.includes(EXTENSION_AUTH_ONLINE_RESPONSE)) {
          const { identifier } = valueReference;
          acc.extensionPriorauthId = getValueFromObject(identifier);
        }

        if (url.includes(EXTENSION_EPISODE)) {
          const { value } = valueIdentifier;
          acc.extensionEpisodeNo = value;
        }

        if (url.includes(EXT_PERIOD_START)) {
          const { start, end } = valuePeriod;
          acc.extensionBatchPeriod = [formatDate(start), formatDate(end)].join(
            " ~ "
          );
        }

        if (url.includes(EXT_ACCOUNT_PERIOD)) {
          acc.extensionAccountPeriod = formatDate(valueDate);
        }

        if (url.includes(EXTENSION_TRANSFER)) {
          acc.extensionIsTransfer = valueBoolean;
        }

        return acc;
      },
      {}
    );
  }

  return null;
};

export default extractClaimSentNphiesDataExtensions;
