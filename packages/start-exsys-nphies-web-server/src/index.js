/*
 *
 * Package: `@exsys-web-server/start-exsys-nphies-web-server`.
 *
 */
import chalk from "chalk";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { createCmdMessage, isWindowsPlatform } from "@exsys-web-server/helpers";
import checkIfPackageAlreadyLinkedElseLink from "./checkIfPackageAlreadyLinkedElseLink.mjs";
import { PACKAGE_NAME } from "./constants.mjs";

const asyncExec = promisify(exec);

(async () => {
  createCmdMessage({
    type: "info",
    message: "check cli bins...",
  });

  const { stdout } = await asyncExec("npm config get prefix");
  const npmGlobalFilePath = (stdout || "").toString().replace(/\n/, "");

  if (!npmGlobalFilePath) {
    createCmdMessage({
      type: "error",
      message: `couldn't get the global \`npm\` path.`,
    });

    process.exit(0);
  }

  const isWindowsOs = isWindowsPlatform();

  const globalNpmBinsFolderPath = isWindowsOs
    ? npmGlobalFilePath
    : join(npmGlobalFilePath, "bin");

  const globalNpmModulesFolderPathSegments = [
    npmGlobalFilePath,
    isWindowsOs ? "" : "lib",
    "node_modules",
    `@exsys-web-server/${PACKAGE_NAME}`,
  ].filter(Boolean);

  await checkIfPackageAlreadyLinkedElseLink({
    globalNpmBinsFolderPath: join(globalNpmBinsFolderPath, PACKAGE_NAME),
    globalNpmModulesFolder: join(...globalNpmModulesFolderPathSegments),
  });

  if (isWindowsOs) {
    createCmdMessage({
      type: "info",
      message:
        "checking scripts execution policy on windows to run our scripts on windows powershell",
    });

    const { stdout: currentUserExecutionPolicy } = await asyncExec(
      "Get-ExecutionPolicy",
      {
        shell: "powershell.exe",
      }
    );

    const currentUserExecutionPolicyWithoutSpaces =
      currentUserExecutionPolicy.replace(/\s|\r/g, "");

    const isExecutionPolicyAlreadyUnRestricted =
      currentUserExecutionPolicyWithoutSpaces === "Unrestricted";

    createCmdMessage({
      type: "info",
      message: chalk.yellow(
        `current scripts policy execution is "${chalk.white.bold(
          currentUserExecutionPolicyWithoutSpaces
        )}" ${
          isExecutionPolicyAlreadyUnRestricted ? "no extra work needed" : ""
        }`
      ),
    });

    if (!isExecutionPolicyAlreadyUnRestricted) {
      createCmdMessage({
        type: "info",
        message: 'changing scripts policy execution to "Unrestricted"',
      });

      const { stderr: forcingPowershellRestrictionError } = await asyncExec(
        'Set-ExecutionPolicy -Scope "CurrentUser" -ExecutionPolicy "Unrestricted"',
        {
          shell: "powershell.exe",
        }
      );

      if (forcingPowershellRestrictionError) {
        createCmdMessage({
          type: "info",
          message: `something went wrong when allowing scripts to run on windows powershell
            sorry, you can't use the app bins.
            `,
        });
      }
    }
  }

  process.exit(0);
})();
