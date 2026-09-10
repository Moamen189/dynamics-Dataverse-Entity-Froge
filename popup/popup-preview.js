/**
 * PreviewManager
 * Handles triggering the page-level Preview modal overlay for Dataverse Entity Forge.
 *
 * Design principles:
 *  - Zero new generation logic. Reads entityGenState directly.
 *  - Sends current generated code, format, and theme to content.js overlay.
 *  - Automatically injects modal scripts/CSS dynamically if tab script is missing.
 */
const PreviewManager = (() => {
    async function ensureContentScriptInjected(tabId) {
        try {
            // Dynamically inject preview CSS into all frames
            await chrome.scripting.insertCSS({
                target: { tabId: tabId, allFrames: true },
                files: ["preview-modal.css"],
            }).catch(() => {});

            // Dynamically inject syntax highlighter and content script
            await chrome.scripting.executeScript({
                target: { tabId: tabId, allFrames: true },
                files: ["popup/highlight/highlight.min.js", "content.js"],
            });
        } catch (err) {
            console.warn("[PreviewManager] Dynamic script injection fallback:", err);
        }
    }

    async function open() {
        // Guard: nothing to preview yet
        if (!entityGenState || !entityGenState.generatedCode) {
            showToast("No generated output available to preview.", "info");
            return;
        }

        const currentTheme =
            document.documentElement.getAttribute("data-theme") || "light";

        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            if (!tab || !tab.id) {
                showToast("Unable to locate active tab to display preview.", "error");
                return;
            }

            const message = {
                type: "OPEN_ENTITY_FORGE_PREVIEW",
                format: entityGenState.format || "cs",
                content: entityGenState.generatedCode,
                theme: currentTheme,
                entityName: entityGenState.entityName || "entity",
            };

            // Attempt to send message directly first
            chrome.tabs.sendMessage(tab.id, message, async (response) => {
                if (chrome.runtime.lastError) {
                    // Content script not loaded in active tab yet — auto-inject dynamically
                    await ensureContentScriptInjected(tab.id);

                    // Retry sending message after dynamic injection
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tab.id, message, (retryResponse) => {
                            if (chrome.runtime.lastError) {
                                showToast("Unable to open preview modal on this tab.", "error");
                            }
                        });
                    }, 120);
                }
            });
        } catch (err) {
            showToast("Unable to communicate with active page tab.", "error");
        }
    }

    function close() {
        // Modal is managed within page context
    }

    return { open, close };
})();
