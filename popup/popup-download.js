const DownloadHelper = (() => {
    const UNSAFE_CHARS = /[/\\:*?"<>|]/g;

    function sanitizeFilename(name) {
        if (!name) return "dataverse-entity";
        return name.replace(UNSAFE_CHARS, "").replace(/\s+/g, "-").toLowerCase();
    }

    function getEnvironmentName(originOrUrl) {
        if (!originOrUrl) return "";
        try {
            let host = originOrUrl;
            if (host.includes("://")) {
                host = new URL(host).hostname;
            }
            const env = host.split(".")[0];
            return env || "";
        } catch (e) {
            return "";
        }
    }

    function generateFilename(entityName, format) {
        const safeName = sanitizeFilename(entityName);
        const ext = format === "cs" ? "cs" : "json";
        const envName = getEnvironmentName(entityGenState.origin);
        const safeEnv = sanitizeFilename(envName);
        const suffix = (safeEnv && safeEnv !== "dataverse-entity") ? safeEnv : "test-data";
        return `${safeName}-${suffix}.${ext}`;
    }

    function downloadFile(content, filename, mimeType) {
        if (!content) {
            showToast("No content to download", "error");
            return;
        }

        try {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            showToast("Download failed", "error");
        }
    }

    function downloadCS() {
        const content = entityGenState.generatedCode;
        if (!content) {
            showToast("Generate an entity first", "error");
            return;
        }

        // If format is JSON, regenerate C# for download
        let csContent = content;
        if (entityGenState.format !== "cs") {
            csContent = generateCode_CS(false);
        }

        const filename = generateFilename(entityGenState.entityName, "cs");
        downloadFile(csContent, filename, "text/plain;charset=utf-8");
        showToast(`Downloaded ${filename}`, "success");
    }

    function downloadJSON() {
        const content = entityGenState.generatedCode;
        if (!content) {
            showToast("Generate an entity first", "error");
            return;
        }

        // If format is C#, regenerate JSON for download
        let jsonContent = content;
        if (entityGenState.format !== "odatajson") {
            jsonContent = generateCode_ODataJSON(false);
        }

        const filename = generateFilename(entityGenState.entityName, "json");
        downloadFile(jsonContent, filename, "application/json;charset=utf-8");
        showToast(`Downloaded ${filename}`, "success");
    }

    return { downloadCS, downloadJSON, generateFilename, sanitizeFilename };
})();
