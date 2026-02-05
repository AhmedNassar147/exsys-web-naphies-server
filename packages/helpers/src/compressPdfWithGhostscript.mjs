/*
 *
 * Helper: `compressPdfWithGhostscript`.
 *
 */
import { spawn } from "child_process";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import createUUID from "./createUUID.mjs";

// 1- install Ghostscript https://ghostscript.com/releases/gsdnld.html
// 2- add C:\Program Files\gs\gs__your_version\bin to your PATH environment variable
// 3- check gswin64c --version works in your terminal

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { windowsHide: true });

    let stderr = "";
    let stdout = "";

    p.stdout?.on("data", (d) => (stdout += d.toString()));
    p.stderr?.on("data", (d) => (stderr += d.toString()));

    p.on("error", (err) => reject(err));
    p.on("close", (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      const msg = stderr || stdout || `Ghostscript exited with code ${code}`;
      reject(new Error(msg));
    });
  });
}

/**
 * @param {Uint8Array|Buffer} pdfBytes
 * @param {{
 *   gsPath?: string,
 *   pdfSettings?: "/screen"|"/ebook"|"/printer"|"/prepress"|"/default",
 *   compatibilityLevel?: "1.4"|"1.5"|"1.6"|"1.7",
 *   quiet?: boolean,
 * }} opts
 */
export default async function compressPdfWithGhostscript(pdfBytes, opts = {}) {
  const {
    gsPath = "gswin64c", // or full path to gswin64c.exe
    pdfSettings = "/screen",
    compatibilityLevel = "1.4",
    quiet = true,
  } = opts;

  const id = createUUID();
  const dir = tmpdir();
  const inFile = join(dir, `in-${id}.pdf`);
  const outFile = join(dir, `out-${id}.pdf`);

  try {
    await writeFile(inFile, Buffer.from(pdfBytes));

    const args = [
      // "-sDEVICE=pdfimage8",
      "-sDEVICE=pdfwrite",
      "-r110",
      `-dCompatibilityLevel=${compatibilityLevel}`,
      `-dPDFSETTINGS=${pdfSettings}`,
      "-dEmbedAllFonts=false",
      "-dSubsetFonts=true",
      "-dCompressFonts=true",
      "-dDetectDuplicateImages=true",
      "-dDownsampleColorImages=true",
      "-dCompressPages=true",
      "-dPreserveAnnots=false",
      "-dPreserveMarkedContent=false",
      "-dPreserveOverprintSettings=false",
      "-dAutoFilterColorImages=false",
      "-dColorImageResolution=100",
      "-dGrayImageResolution=80",
      "-dMonoImageResolution=80",
      "-dColorImageFilter=/DCTEncode",
      "-dJPEGQ=40",
      "-dPreserveOPIComments=false",
      "-dPreserveEPSInfo=false",
      "-dNOPAUSE",
      "-dBATCH",
      ...(quiet ? ["-dQUIET"] : []),
      `-sOutputFile=${outFile.replace(/\\/g, "/")}`,
      inFile,
    ];

    await run(gsPath, args);
    const out = await readFile(outFile);
    return out;
  } finally {
    await Promise.all([unlink(inFile), unlink(outFile)]);
  }
}
