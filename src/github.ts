import axios from "axios";

interface GithubContent {
    name: string;
    path: string;
    type: string;
    content?: string;
    download_url?: string;
}

export async function getGithubRepoContent(
    owner: string,
    repo: string,
    path: string = "",
): Promise<string> {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        );
        const contents: GithubContent[] = response.data;

        let fullText = "";

        for (const item of contents) {
            if (item.type === "file") {
                if (item.download_url) {
                    const fileResponse = await axios.get(item.download_url);
                    fullText += `\n\n### File: ${item.path}\n`;
                    fullText += fileResponse.data;
                }
            } else if (item.type === "dir") {
                const subDirContent = await getGithubRepoContent(
                    owner,
                    repo,
                    item.path,
                );
                fullText += subDirContent;
            }
        }

        return fullText;
    } catch (error) {
        console.error("Error fetching GitHub content:", error);
        throw error;
    }
}
