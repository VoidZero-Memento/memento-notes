export type GithubTreeItem = {
  path: string;
  name: string;
  type: "tree" | "blob";
  sha: string;
  size?: number;
};

export type GithubFileTreeNode = {
  name: string;
  path: string;
  type: "tree" | "blob";
  sha: string;
  children?: GithubFileTreeNode[];
};

export type GithubNoteListItem = {
  path: string;
  name: string;
  sha: string;
};

export type GithubNoteContent = {
  path: string;
  content: string;
};
