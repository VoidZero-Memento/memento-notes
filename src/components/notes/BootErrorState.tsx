import { useState } from "react";

import { describeGithubError } from "@/lib/github/describe-github-error";
import { clearGithubToken, getGithubToken, hasGithubToken, setGithubToken } from "@/lib/github/github-token";
import { EmptyState } from "@/components/common/EmptyState";
import styles from "./BootErrorState.module.css";
import shellStyles from "./NotesShell.module.css";

type BootErrorStateProps = {
  message: string;
  onRetry: () => void;
};

const TOKEN_HELP_URL = "https://github.com/settings/tokens";

export const BootErrorState = ({ message, onRetry }: BootErrorStateProps) => {
  const described = describeGithubError(message);
  const [tokenFormOpen, setTokenFormOpen] = useState(false);
  const [tokenDraft, setTokenDraft] = useState(() => getGithubToken() ?? "");
  const [tokenHint, setTokenHint] = useState<string | null>(null);

  const handleSaveToken = () => {
    const next = tokenDraft.trim();
    if (!next) {
      clearGithubToken();
      setTokenHint("已清除令牌");
      return;
    }
    setGithubToken(next);
    setTokenHint("令牌已保存，正在重试…");
    setTokenFormOpen(false);
    onRetry();
  };

  const handleClearToken = () => {
    clearGithubToken();
    setTokenDraft("");
    setTokenHint("已清除令牌");
  };

  const tokenToggleLabel = tokenFormOpen ? "收起" : hasGithubToken() ? "更新令牌" : "配置令牌";

  return (
    <div className={shellStyles.bootState}>
      <EmptyState
        variant="error"
        title={described.title}
        description={described.description}
        action={{ label: "重试", onClick: onRetry }}
        footer={
          <div className={styles.textLinks}>
            {described.suggestToken ? (
              <>
                <button
                  type="button"
                  className={styles.textLink}
                  onClick={() => {
                    setTokenHint(null);
                    setTokenFormOpen((open) => !open);
                  }}
                >
                  {tokenToggleLabel}
                </button>
                <span className={styles.textSep} aria-hidden>
                  ·
                </span>
              </>
            ) : null}
            <button type="button" className={styles.textLink} onClick={() => window.location.reload()}>
              刷新页面
            </button>
          </div>
        }
      >
        {tokenFormOpen ? (
          <div className={styles.tokenForm}>
            <label className={styles.tokenLabel} htmlFor="github-token-input">
              GitHub Personal Access Token
            </label>
            <input
              id="github-token-input"
              className={styles.tokenInput}
              type="password"
              lang="en"
              inputMode="url"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="粘贴 gh_ / ghp_ 开头的令牌"
              value={tokenDraft}
              onChange={(event) => setTokenDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSaveToken();
              }}
            />
            <p className={styles.tokenTip}>仅保存在本机浏览器，用于提高 API 限额。</p>
            <div className={styles.textLinks}>
              <button type="button" className={`${styles.textLink} ${styles.textLinkSave}`} onClick={handleSaveToken}>
                保存
              </button>
              <span className={styles.textSep} aria-hidden>
                ·
              </span>
              <button type="button" className={`${styles.textLink} ${styles.textLinkClear}`} onClick={handleClearToken}>
                清除
              </button>
              <span className={styles.textSep} aria-hidden>
                ·
              </span>
              <a className={`${styles.textLink} ${styles.textLinkHelp}`} href={TOKEN_HELP_URL} target="_blank" rel="noreferrer">
                如何创建
              </a>
            </div>
            {tokenHint ? <p className={styles.tokenHint}>{tokenHint}</p> : null}
          </div>
        ) : null}
      </EmptyState>
    </div>
  );
};
