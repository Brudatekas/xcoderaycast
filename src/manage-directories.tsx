import { useState } from "react";
import { List, ActionPanel, Action, Icon, Form, useNavigation } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { getSearchDirectories, setSearchDirectories } from "./utils";

export default function Command() {
  const { isLoading, data: directories, mutate } = usePromise(getSearchDirectories);

  async function addDirectory(newDir: string) {
    if (!directories) return;
    const cleanDir = newDir.replace("file://", "");
    if (directories.includes(cleanDir)) return;
    const newDirs = [...directories, cleanDir];
    await setSearchDirectories(newDirs);
    mutate();
  }

  async function removeDirectory(dir: string) {
    if (!directories) return;
    const newDirs = directories.filter((d) => d !== dir);
    await setSearchDirectories(newDirs);
    mutate();
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search configured directories">
      {directories?.length === 0 && (
        <List.EmptyView
          title="No directories configured"
          description="Press Enter to add a new search directory"
          icon={Icon.Folder}
          actions={
            <ActionPanel>
              <Action.Push title="Add Directory" target={<AddDirectoryForm onAdd={addDirectory} />} icon={Icon.Plus} />
            </ActionPanel>
          }
        />
      )}
      {directories?.map((dir) => (
        <List.Item
          key={dir}
          title={dir}
          icon={Icon.Folder}
          actions={
            <ActionPanel>
              <Action.Push title="Add Directory" target={<AddDirectoryForm onAdd={addDirectory} />} icon={Icon.Plus} />
              <Action
                title="Remove Directory"
                onAction={() => removeDirectory(dir)}
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["ctrl"], key: "x" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function AddDirectoryForm(props: { onAdd: (dir: string) => void }) {
  const { pop } = useNavigation();
  const [files, setFiles] = useState<string[]>([]);

  function handleSubmit() {
    if (files.length > 0) {
      props.onAdd(files[0]);
      pop();
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Directory" onSubmit={handleSubmit} icon={Icon.Plus} />
        </ActionPanel>
      }
    >
      <Form.FilePicker
        id="directory"
        title="Select Directory"
        allowMultipleSelection={false}
        canChooseDirectories
        canChooseFiles={false}
        value={files}
        onChange={setFiles}
      />
    </Form>
  );
}
