/*
 *
 * Helper: `buildOrganizationPath`.
 *
 */
const buildOrganizationPath = (
  organizationNo,
  clinicalEntityNo,
  skipThrowingOrganizationError
) => {
  if (!organizationNo) {
    if (skipThrowingOrganizationError) {
      return ["organization_no_found", clinicalEntityNo]
        .filter(Boolean)
        .join("-");
    }

    throw new Error("organizationNo wasn't provided to getCertificateData");
  }

  return [organizationNo, clinicalEntityNo].filter(Boolean).join("-");
};

export default buildOrganizationPath;
