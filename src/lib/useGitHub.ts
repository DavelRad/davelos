import { useEffect, useState } from "react";

export interface GitHubData {
  login: string;
  name: string | null;
  followers: number;
  publicRepos: number;
  htmlUrl: string;
}

interface State {
  data: GitHubData | null;
  loading: boolean;
  /** true when we fell back to static values (offline / rate-limited). */
  fallback: boolean;
}

const FALLBACK: GitHubData = {
  login: "DavelRad",
  name: "Davel Radindra",
  followers: 0,
  publicRepos: 0,
  htmlUrl: "https://github.com/DavelRad",
};

/**
 * Live fetch of github.com/users/DavelRad with a graceful, honestly-labeled
 * fallback when offline or rate-limited.
 */
export function useGitHub(username = "DavelRad") {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    fallback: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      try {
        const res = await fetch(`https://api.github.com/users/${username}`, {
          signal: controller.signal,
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        const json = (await res.json()) as {
          login: string;
          name: string | null;
          followers: number;
          public_repos: number;
          html_url: string;
        };
        if (!active) return;
        setState({
          data: {
            login: json.login,
            name: json.name,
            followers: json.followers,
            publicRepos: json.public_repos,
            htmlUrl: json.html_url,
          },
          loading: false,
          fallback: false,
        });
      } catch (err) {
        if (!active || (err instanceof DOMException && err.name === "AbortError"))
          return;
        setState({ data: FALLBACK, loading: false, fallback: true });
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [username]);

  return state;
}
