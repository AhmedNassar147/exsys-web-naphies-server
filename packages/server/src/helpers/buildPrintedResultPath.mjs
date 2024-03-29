/*
 *
 * Helper: `buildPrintedResultPath`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import { CLI_CONFIG } from "../constants.mjs";
import buildOrganizationPath from "./buildOrganizationPath.mjs";

const { client } = CLI_CONFIG;

const buildPrintedResultPath = ({
  organizationNo,
  clinicalEntityNo,
  innerFolderName,
  segments,
  shouldFilterSegments,
  skipThrowingOrganizationError,
}) => {
  const organizationOrOrganizationUnitPath = buildOrganizationPath(
    organizationNo,
    clinicalEntityNo,
    skipThrowingOrganizationError
  );

  let _segments = isArrayHasData(segments) ? segments : [];

  if (shouldFilterSegments) {
    _segments = _segments.filter(Boolean);
  }

  const folderName = [
    client,
    organizationOrOrganizationUnitPath,
    innerFolderName,
    ..._segments,
  ].join("/");

  return folderName;
};

export default buildPrintedResultPath;
