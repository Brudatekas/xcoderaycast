import { List, ActionPanel, Action, showToast, Toast, open, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { findXcodeProjects, runCommand, XcodeProject } from "./utils";
import path from "path";

export default function Command() {
  const { isLoading, data } = usePromise(async () => {
    return await findXcodeProjects();
  }, []);

  async function runProject(project: XcodeProject) {
    let toast: Toast | undefined;

    try {
      toast = await showToast({
        style: Toast.Style.Animated,
        title: "Building Xcode Project...",
        message: project.name,
      });

      // Ensure the build is up-to-date
      await runCommand("xcodebuild build", project.dir);

      toast.title = "Gathering build settings...";
      toast.message = "Locating executable app...";

      // Attempt to find the built product
      const { stdout } = await runCommand("xcodebuild -showBuildSettings", project.dir);
      const match = stdout.match(/CODESIGNING_FOLDER_PATH = (.*)/) || stdout.match(/EXECUTABLE_FOLDER_PATH = (.*)/);

      if (match) {
        const appPath = match[1].trim();

        toast.title = "Running Application...";
        toast.message = path.basename(appPath);

        await open(appPath);

        toast.style = Toast.Style.Success;
        toast.title = "App Launched";
      } else {
        toast.style = Toast.Style.Failure;
        toast.title = "App Launch Failed";
        toast.message = "Could not find built app path in xcodebuild output.";
      }
    } catch (error) {
      if (toast) {
        toast.style = Toast.Style.Failure;
        toast.title = "Failed";
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
    <List isLoading={isLoading} searchBarPlaceholder="Search Xcode Projects">
      {data?.map((project) => (
        <List.Item
          key={project.id}
          title={project.name}
          subtitle={project.dir}
          icon={Icon.Play}
          actions={
            <ActionPanel>
              <Action title="Run Project" onAction={() => runProject(project)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
