export type GithubRepoConfig = {
  id: string;
  label: string;
  owner: string;
  ownerAvatarUrl?: string;
  repo: string;
  branch: string;
};

export type GithubOrgConfig = {
  owner: string;
};
