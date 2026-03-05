import { List, ActionPanel, Action, showToast, Toast, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { findXcodeProjects, runCommand, XcodeProject } from "./utils";

export default function Command() {
  const { isLoading, data } = usePromise(async () => {
    return await findXcodeProjects();
  }, []);

  async function buildProject(project: XcodeProject) {
    let toast: Toast | undefined;
    try {
      toast = await showToast({
        style: Toast.Style.Animated,
        title: "Building Xcode Project...",
        message: project.name,
      });

      await runCommand("xcodebuild build", project.dir);

      toast.style = Toast.Style.Success;
      toast.title = "Build Succeeded";
      toast.message = `Built ${project.name}`;
    } catch (error) {
      if (toast) {
        toast.style = Toast.Style.Failure;
        toast.title = "Build Failed";
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
          icon={Icon.Hammer}
          actions={
            <ActionPanel>
              <Action title="Build Project" onAction={() => buildProject(project)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
