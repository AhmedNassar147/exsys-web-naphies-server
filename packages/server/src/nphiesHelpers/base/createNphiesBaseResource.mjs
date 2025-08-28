/*
 *
 * Helpers: `createNphiesBaseResource`.
 *
 */
import { createUUID } from "@exsys-web-server/helpers";
import {
  NPHIES_API_URLS,
  NPHIES_RESOURCE_TYPES,
  NPHIES_BASE_PROFILE_TYPES,
} from "../../constants.mjs";

const { BASE_PROFILE_URL } = NPHIES_API_URLS;
const { BUNDLE } = NPHIES_RESOURCE_TYPES;
const { PROFILE_BUNDLE } = NPHIES_BASE_PROFILE_TYPES;

const createNphiesBaseResource = ({
  resourceType,
  profileType,
  uuid,
  extraMeta,
} = {}) => ({
  resourceType: resourceType || BUNDLE,
  id: (uuid || createUUID()).toString(),
  meta: {
    profile: [`${BASE_PROFILE_URL}/${profileType || PROFILE_BUNDLE}`],
    ...(extraMeta || {}),
  },
});

export default createNphiesBaseResource;
