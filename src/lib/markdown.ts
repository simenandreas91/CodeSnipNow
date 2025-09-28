import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/ServiceNowDevProgram/code-snippets/main';

export function renderMarkdown(text: string, repoPath?: string): string {
  const originalText = text ?? '';

  try {
    let processedText = originalText;

    processedText = processedText.replace(
      /!\[([^\]]*)\]\(https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+?)\)/g,
      (match, alt, owner, repo, branchOrHash, path) => {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branchOrHash}/${path}`;
        return `![${alt}](${rawUrl})`;
      }
    );

    if (repoPath) {
      const normalizedRepoPath = repoPath.replace(/^\.\//, '');
      processedText = processedText.replace(
        /!\[([^\]]*)\]\((?!https:)([^)]+)\)/g,
        (match, alt, relativePath) => {
          const imageFilename = relativePath.replace(/^\.\//, '');
          const fullPath = `${normalizedRepoPath}/${imageFilename}`;
          const encodedPath = encodeURIComponent(fullPath);
          const rawUrl = `${GITHUB_RAW_BASE_URL}/${encodedPath}`;
          return `![${alt}](${rawUrl})`;
        }
      );
    }

    return marked(processedText);
  } catch (error) {
    console.warn('Error rendering markdown:', error);
    return originalText;
  }
}

