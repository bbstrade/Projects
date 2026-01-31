const token = process.env.GITHUB_TOKEN || "your_token_here";
console.log("Creating repo...");
try {
    const response = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "bun-script"
        },
        body: JSON.stringify({
            name: "Projects",
            private: false
        })
    });

    console.log("Status:", response.status);
    console.log("Body:", await response.text());
} catch (error) {
    console.error("Error:", error);
}
