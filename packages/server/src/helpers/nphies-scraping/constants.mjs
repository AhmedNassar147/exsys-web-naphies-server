/*
 *
 * Constants: `nphies-scraping`.
 *
 */
export const loadingPageTimeout = 100000;

export const nphiesViewerPageName = "viewer.nphies.sa/LightFHIR";
export const loginPageUrl =
  "https://sso.nphies.sa/auth/realms/sehaticoreprod/protocol/openid-connect/auth?client_id=tv-ui&redirect_uri=https%3A%2F%2Fviewer.nphies.sa%2FLightFHIR&state=2f70125f-1c82-41af-b7d0-62461ef7b07b&response_mode=fragment&response_type=code&scope=openid&nonce=28f2911e-f02d-4903-85f2-41d4627c2506";

// const loginUserName = "nlubad@sagaf-eye.com";
// const loginPassword = "ALsaggaf@20121";

export const loginUserName = "Halsaggaf@sagaf-eye.com";
export const loginPassword = "Hussien123";

export const loginButtonSelector = "input[name='login']";
export const optFieldSelector = "input[name='otp-number']";

export const dashboardSideBarSelector = "ul[class='assista-aside-list']";
export const dashboardSideBarClaimsSelector = `${dashboardSideBarSelector} > li:nth-child(4)`;
export const dashboardSideBarPreAuthorizationsSelector = `${dashboardSideBarSelector} > li:nth-child(3)`;

export const otpPageSubmissionApiUrl =
  "auth/realms/sehaticoreprod/login-actions/authenticate?session_code";

export const scrapFoldername = "nphiesDashboardScraping";

export const ignoredUrlsSubValues = [
  ".svg",
  ".css",
  ".png",
  ".jpg",
  ".woff",
  ".woff2",
  "login-actions/authenticate",
  "recaptcha",
];
