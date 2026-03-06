import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { getSchemes, XcodeProject } from "../utils";

/**
 * A shared React component that lists Xcode schemes for a given project,
 * allowing the user to select one and trigger an action (run, build, install).
 */
export function SchemeList({
  project,
  onSelect,
  actionTitle,
  actionIcon,
}: {
  project: XcodeProject;
  onSelect: (scheme: string) => void;
  actionTitle: string;
  actionIcon: Icon;
}) {
  const { isLoading, data: schemes } = usePromise(async () => {
    // Fetch schemes for the selected project
    return await getSchemes(project.dir);
  }, []);

  return (
    <List isLoading={isLoading} searchBarPlaceholder={`Select Scheme for ${project.name}`}>
      {schemes?.length === 0 && !isLoading ? (
        <List.EmptyView title="No Schemes Found" description="Could not find any schemes for this project." />
      ) : (
        schemes?.map((scheme) => (
          <List.Item
            key={scheme}
            title={scheme}
            icon={Icon.Box}
            actions={
              <ActionPanel>
                <Action title={actionTitle} icon={actionIcon} onAction={() => onSelect(scheme)} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
