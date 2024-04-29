/*
 *
 * Helper: `buildPrintedResultPath`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import buildOrganizationPath from "./buildOrganizationPath.mjs";

const buildPrintedResultPath = ({
  clientName,
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
    clientName,
    organizationOrOrganizationUnitPath,
    innerFolderName,
    ..._segments,
  ].join("/");

  return folderName;
};

export default buildPrintedResultPath;
