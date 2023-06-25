/*
 *
 * Helpers: `createNphiesBaseRequestData`.
 *
 */
import { createTimestamp } from "@exsys-web-server/helpers";
import createNphiesBaseResource from "./createNphiesBaseResource.mjs";
import { NPHIES_BUNDLE_TYPES } from "../../constants.mjs";

const { MESSAGE } = NPHIES_BUNDLE_TYPES;

const createNphiesBaseRequestData = ({
  resourceType,
  bundleType,
  profileType,
} = {}) => ({
  ...createNphiesBaseResource({
    resourceType,
    profileType,
  }),
  type: bundleType || MESSAGE,
  timestamp: createTimestamp(),
});

export default createNphiesBaseRequestData;
