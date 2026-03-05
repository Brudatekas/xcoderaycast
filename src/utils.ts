/**
 * Utilities for Xcode Raycast Extension.
 *
 * This file contains common functionalities used by the extension's commands:
 * - `findXcodeProjects`: Uses mdfind to search for Xcode projects & workspaces globally.
 * - `runCommand`: Executes a given shell command (e.g., `xcodebuild`) with a configured buffer.
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";

import { LocalStorage } from "@raycast/api";

export const execAsync = promisify(exec);

export interface XcodeProject {
  id: string;
  name: string;
  path: string;
  dir: string;
}

const STORAGE_KEY = "search_directories";

/**
 * Gets the current configured search directories.
 * Defaults to ["~/macosprojs"] if none configured.
 */
export async function getSearchDirectories(): Promise<string[]> {
  const data = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  return ["~/macosprojs"];
}

/**
 * Sets the configured search directories.
 */
export async function setSearchDirectories(dirs: string[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(dirs));
}

/**
 * Gets a list of Xcode projects using the find command in the preferred directories.
 * Searches for .xcodeproj and .xcworkspace bundles up to depth 5.
 *
 * @returns {Promise<XcodeProject[]>} Array of found projects.
 */
export async function findXcodeProjects(): Promise<XcodeProject[]> {
  try {
    const searchDirs = await getSearchDirectories();
    const resolvedDirs = searchDirs.map((dir) => {
      let resolved = dir;
      if (resolved.startsWith("~/")) {
        resolved = path.join(os.homedir(), resolved.slice(1));
      }
      return `"${resolved}"`;
    });

    // Use find to locate directories ending in .xcodeproj or .xcworkspace.
    // We restrict depth to 5 for speed
    const findCmd = `find ${resolvedDirs.join(" ")} -maxdepth 5 -type d \\( -name "*.xcodeproj" -o -name "*.xcworkspace" \\) 2>/dev/null`;

    const { stdout } = await execAsync(findCmd, { maxBuffer: 1024 * 1024 * 10 });

    // Sort paths alphabetically.
    const paths = stdout
      .split("\n")
      .filter((p) => p.trim().length > 0)
      .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

    const projects: XcodeProject[] = paths.map((projPath) => ({
      id: projPath,
      name: path.basename(projPath),
      path: projPath,
      dir: path.dirname(projPath),
    }));

    return projects;
  } catch {
    // Return empty array if mdfind fails or nothing is found
    return [];
  }
}

/**
 * Runs a shell command asynchronously and returns its stdout and stderr.
 * Increased maxBuffer is used to accommodate large output from tools like `xcodebuild`.
 *
 * @param command - The shell command to execute.
 * @param cwd - The working directory to execute the command in.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function runCommand(command: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
  // We use a high maxBuffer because xcodebuild output can be extremely long
  return execAsync(command, { cwd, maxBuffer: 1024 * 1024 * 20 });
}
