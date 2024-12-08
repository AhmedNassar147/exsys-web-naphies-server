/*
 *
 * Package: `@exsys-web-server/start-exsys-nphies-web-server`.
 *
 */
import { join } from "path";
import { exec, spawn } from "child_process";
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

  const __globalNpmBinsFolderPath = join(globalNpmBinsFolderPath, PACKAGE_NAME);
  const __globalNpmModulesFolder = join(...globalNpmModulesFolderPathSegments);

  await checkIfPackageAlreadyLinkedElseLink({
    globalNpmBinsFolderPath: __globalNpmBinsFolderPath,
    globalNpmModulesFolder: __globalNpmModulesFolder,
  });

  if (isWindowsOs) {
    createCmdMessage({
      type: "info",
      message: 'changing scripts policy execution to "Unrestricted"',
    });

    const scriptPath = `${process.cwd()}\\src\\checkExecutionPolicy.ps1`;

    // Spawn a PowerShell process to run the script
    const powershell = spawn("powershell.exe", [
      "-ExecutionPolicy",
      "ByPass", // Temporarily bypass the execution policy
      "-File",
      scriptPath, // Specify the script file
    ]);

    // Capture the output of the script
    powershell.stdout.on("data", (data) => {
      createCmdMessage({
        type: "info",
        message: data,
      });
    });

    // Capture any error output
    powershell.stderr.on("data", (data) => {
      createCmdMessage({
        type: "error",
        message: data,
      });
    });

    // Capture when the process ends
    powershell.on("close", (code) => {
      createCmdMessage({
        type: "error",
        message: `PowerShell script exited with code ${code}`,
      });
    });
  }

  process.exit(0);
})();
