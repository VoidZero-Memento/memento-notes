const STORAGE_KEY = "memento-notes:github-token";

export const getGithubToken = (): string | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
};

export const setGithubToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEY, token.trim());
};

export const clearGithubToken = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const hasGithubToken = (): boolean => Boolean(getGithubToken());
