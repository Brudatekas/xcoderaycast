import { List, ActionPanel, Action, showToast, Toast, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { findXcodeProjects, runCommand, getBuiltAppPath, XcodeProject } from "./utils";
import { SchemeList } from "./components/SchemeList";
import path from "path";

/**
 * Raycast command to build a selected scheme in Release configuration
 * and copy the resulting app bundle to the /Applications directory.
 */
export default function Command() {
  const { isLoading, data } = usePromise(async () => {
    return await findXcodeProjects();
  }, []);

  async function installProject(project: XcodeProject, scheme: string) {
    let toast: Toast | undefined;

    try {
      toast = await showToast({
        style: Toast.Style.Animated,
        title: "Building Release Scheme...",
        message: `${project.name} (${scheme})`,
      });

      // Build the Release configuration
      await runCommand(`xcodebuild build -scheme "${scheme}" -configuration Release`, project.dir);

      toast.title = "Locating built app...";
      const appPath = await getBuiltAppPath(project.dir, scheme, "Release");

      if (appPath) {
        const appName = path.basename(appPath);
        const targetPath = `/Applications/${appName}`;

        toast.title = "Installing App...";
        toast.message = `Copying ${appName} to /Applications`;

        // Remove old app if it exists, and copy new one
        await runCommand(`rm -rf "${targetPath}"`, project.dir);
        await runCommand(`cp -R "${appPath}" "${targetPath}"`, project.dir);

        toast.style = Toast.Style.Success;
        toast.title = "App Installed Successfully";
        toast.message = `Moved ${appName} to /Applications`;
      } else {
        toast.style = Toast.Style.Failure;
        toast.title = "Install Failed";
        toast.message = "Could not find built app path in xcodebuild output.";
      }
    } catch (error) {
      if (toast) {
        toast.style = Toast.Style.Failure;
        toast.title = "Install Failed";
        if (error instanceof Error) {
          toast.message = error.message;
        }
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: String(error),
        });
      }
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search Xcode Projects to Install">
      {data?.map((project) => (
        <List.Item
          key={project.id}
          title={project.name}
          subtitle={project.dir}
          icon={Icon.HardDrive}
          actions={
            <ActionPanel>
              <Action.Push
                title="Select Scheme to Install"
                icon={Icon.HardDrive}
                target={
                  <SchemeList
                    project={project}
                    actionTitle="Install Scheme"
                    actionIcon={Icon.HardDrive}
                    onSelect={(scheme) => installProject(project, scheme)}
                  />
                }
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
