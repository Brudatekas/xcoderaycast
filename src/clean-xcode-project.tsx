import { List, ActionPanel, Action, showToast, Toast, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { findXcodeProjects, runCommand, XcodeProject } from "./utils";
import { SchemeList } from "./components/SchemeList";

export default function Command() {
  const { isLoading, data } = usePromise(async () => {
    return await findXcodeProjects();
  }, []);

  async function cleanProject(project: XcodeProject, scheme: string) {
    let toast: Toast | undefined;
    try {
      toast = await showToast({
        style: Toast.Style.Animated,
        title: "Cleaning Xcode Project...",
        message: `${project.name} (${scheme})`,
      });

      await runCommand(`xcodebuild clean -scheme "${scheme}"`, project.dir);

      toast.style = Toast.Style.Success;
      toast.title = "Clean Succeeded";
      toast.message = `Cleaned ${project.name} (${scheme})`;
    } catch (error) {
      if (toast) {
        toast.style = Toast.Style.Failure;
        toast.title = "Clean Failed";
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
    <List isLoading={isLoading} searchBarPlaceholder="Search Xcode Projects to Clean">
      {data?.map((project) => (
        <List.Item
          key={project.id}
          title={project.name}
          subtitle={project.dir}
          icon={Icon.Trash}
          actions={
            <ActionPanel>
              <Action.Push
                title="Select Scheme to Clean"
                icon={Icon.Trash}
                target={
                  <SchemeList
                    project={project}
                    actionTitle="Clean Scheme"
                    actionIcon={Icon.Trash}
                    onSelect={(scheme) => cleanProject(project, scheme)}
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
