export type GithubErrorKind = "rate_limit" | "network" | "auth" | "empty" | "unknown";

export type DescribedGithubError = {
  title: string;
  description: string;
  kind: GithubErrorKind;
  suggestToken: boolean;
};

export const describeGithubError = (message: string): DescribedGithubError => {
  if (/rate limit exceeded/i.test(message)) {
    return {
      title: "请求过于频繁",
      description: "GitHub API 调用次数已达上限。可稍后重试，或配置访问令牌以提高限额。",
      kind: "rate_limit",
      suggestToken: true,
    };
  }

  if (/failed to fetch|networkerror|network request failed|load failed/i.test(message)) {
    return {
      title: "网络连接失败",
      description: "请检查网络后重试。",
      kind: "network",
      suggestToken: false,
    };
  }

  if (/401|bad credentials|requires authentication/i.test(message)) {
    return {
      title: "令牌无效",
      description: "当前访问令牌无效或已过期，请重新配置后重试。",
      kind: "auth",
      suggestToken: true,
    };
  }

  if (/\b403\b|forbidden/i.test(message)) {
    return {
      title: "无权访问",
      description: "当前请求被拒绝，可配置访问令牌后重试。",
      kind: "auth",
      suggestToken: true,
    };
  }

  if (/该组织没有可用|未找到可用仓库/.test(message)) {
    return {
      title: "暂无可用仓库",
      description: "当前组织下没有可展示的公开仓库。",
      kind: "empty",
      suggestToken: false,
    };
  }

  return {
    title: "加载失败",
    description: "暂时无法完成请求，请稍后重试。",
    kind: "unknown",
    suggestToken: true,
  };
};
