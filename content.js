if (!window.__DEF_CONTENT_SCRIPT_INITIALIZED__) {
    window.__DEF_CONTENT_SCRIPT_INITIALIZED__ = true;

    function injectWorker() {
        if (!document.querySelector("script[src*='worker.js']")) {
            const script = document.createElement("script");
            script.src = chrome.runtime.getURL("worker.js");
            (document.head || document.documentElement).appendChild(script);
            script.onload = () => script.remove();
        }
    }

    // Response forwarder
    window.addEventListener("message", (event) => {
        if (event.data && event.data.EntityGeneratorResponse) {
            chrome.runtime.sendMessage(event.data);
        }
    });

    injectWorker();
}

// Preview Modal Manager (Content Script Context)
const EntityForgePreviewModal = (() => {
    const OVERLAY_ID = "defPreviewOverlay";
    let _rawContent = "";
    let _currentFormat = "cs";
    let _entityName = "entity";
    let _currentTheme = "light";
    let _originalOverflow = null;
    let _escapeListener = null;

    function getTargetDoc() {
        try {
            if (window.top && window.top.document && window.top.document.body) {
                return window.top.document;
            }
        } catch (e) {
            // Cross-origin fallback
        }
        return document;
    }

    function escapeHTML(str) {
        if (typeof str !== "string") return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function createModalDOM() {
        const doc = getTargetDoc();
        let overlay = doc.getElementById(OVERLAY_ID);
        if (overlay) return overlay;

        overlay = doc.createElement("div");
        overlay.id = OVERLAY_ID;
        overlay.className = "def-preview-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "defPreviewTitle");

        overlay.innerHTML = `
            <div class="def-preview-modal" id="defPreviewModal">
                <div class="def-preview-header">
                    <div class="def-preview-title-group">
                        <div class="def-preview-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <ellipse cx="8" cy="8" rx="7" ry="5" stroke="currentColor" stroke-width="1.5"/>
                                <circle cx="8" cy="8" r="2" fill="currentColor"/>
                            </svg>
                        </div>
                        <h2 class="def-preview-title" id="defPreviewTitle">Preview</h2>
                        <span class="def-preview-badge" id="defPreviewBadge">C#</span>
                    </div>
                    <div class="def-preview-controls">
                        <button class="def-preview-icon-btn" id="defPreviewThemeToggle" type="button" aria-label="Toggle theme" title="Toggle light/dark theme">
                            <svg class="def-preview-sun-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <circle cx="12" cy="12" r="5"/>
                                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                            </svg>
                            <svg class="def-preview-moon-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                            </svg>
                        </button>
                        <button class="def-preview-icon-btn" id="defPreviewCloseX" type="button" aria-label="Close preview" title="Close preview">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="def-preview-content">
                    <div class="def-preview-code-container">
                        <pre class="def-preview-pre"><code class="def-preview-code" id="defPreviewCode"></code></pre>
                    </div>
                </div>
                <div class="def-preview-footer">
                    <button class="def-preview-btn def-preview-btn-primary" id="defPreviewCopyBtn" type="button" aria-label="Copy code to clipboard">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.4"/>
                        </svg>
                        <span id="defPreviewCopyText">Copy</span>
                    </button>
                    <button class="def-preview-btn def-preview-btn-secondary" id="defPreviewDownloadBtn" type="button" aria-label="Download generated code">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 12v1.5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5V12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span id="defPreviewDownloadText">Download</span>
                    </button>
                    <button class="def-preview-btn def-preview-btn-secondary" id="defPreviewCloseFooterBtn" type="button" aria-label="Close preview">
                        Close
                    </button>
                </div>
            </div>
        `;

        (doc.body || doc.documentElement).appendChild(overlay);

        // Bind internal events
        const closeX = overlay.querySelector("#defPreviewCloseX");
        const closeFooter = overlay.querySelector("#defPreviewCloseFooterBtn");
        const copyBtn = overlay.querySelector("#defPreviewCopyBtn");
        const downloadBtn = overlay.querySelector("#defPreviewDownloadBtn");
        const themeBtn = overlay.querySelector("#defPreviewThemeToggle");

        if (closeX) closeX.addEventListener("click", close, false);
        if (closeFooter) closeFooter.addEventListener("click", close, false);
        if (copyBtn) copyBtn.addEventListener("click", copyContent, false);
        if (downloadBtn) downloadBtn.addEventListener("click", downloadContent, false);
        if (themeBtn) themeBtn.addEventListener("click", toggleTheme, false);

        // Close on clicking backdrop outside modal
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                close();
            }
        }, false);

        return overlay;
    }

    function renderCodeHighlighting(doc, overlay) {
        const codeEl = overlay.querySelector("#defPreviewCode");
        if (!codeEl) return;

        const lang = _currentFormat === "odatajson" ? "json" : "csharp";
        let highlighted = "";
        const hljsObj = window.hljs || (window.top && window.top.hljs);

        if (hljsObj && _rawContent) {
            try {
                highlighted = hljsObj.highlight(_rawContent, { language: lang }).value;
            } catch (err) {
                try {
                    highlighted = hljsObj.highlightAuto(_rawContent).value;
                } catch (err2) {
                    highlighted = escapeHTML(_rawContent);
                }
            }
        } else {
            highlighted = escapeHTML(_rawContent);
        }
        codeEl.innerHTML = highlighted;
    }

    function toggleTheme() {
        _currentTheme = _currentTheme === "dark" ? "light" : "dark";
        const doc = getTargetDoc();
        const overlay = doc.getElementById(OVERLAY_ID);
        if (overlay) {
            overlay.setAttribute("data-theme", _currentTheme);
            renderCodeHighlighting(doc, overlay);
        }

        // Persist theme choice if extension storage is available
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ def_theme: _currentTheme }, () => {});
        }
    }

    function open(data) {
        const { format, content, theme, entityName } = data;
        _rawContent = content || "";
        _currentFormat = format || "cs";
        _entityName = entityName || "entity";
        _currentTheme = theme || "light";

        const doc = getTargetDoc();
        const overlay = createModalDOM();

        // Apply theme
        overlay.setAttribute("data-theme", _currentTheme);

        // Update badge and download button label
        const badgeEl = overlay.querySelector("#defPreviewBadge");
        if (badgeEl) {
            badgeEl.textContent = _currentFormat === "odatajson" ? "JSON" : "C#";
        }

        const downloadText = overlay.querySelector("#defPreviewDownloadText");
        if (downloadText) {
            downloadText.textContent = _currentFormat === "odatajson" ? "Download JSON" : "Download C#";
        }

        // Render highlighted code
        renderCodeHighlighting(doc, overlay);

        // Reset copy button state
        const copyBtn = overlay.querySelector("#defPreviewCopyBtn");
        const copyText = overlay.querySelector("#defPreviewCopyText");
        if (copyBtn && copyText) {
            copyBtn.classList.remove("def-preview-btn-success");
            copyText.textContent = "Copy";
        }

        // Prevent body scrolling
        if (doc.body) {
            if (_originalOverflow === null) {
                _originalOverflow = doc.body.style.overflow || "";
            }
            doc.body.style.overflow = "hidden";
        }

        // Show modal
        overlay.classList.add("def-preview-open");

        // Focus close X button for accessibility
        const closeX = overlay.querySelector("#defPreviewCloseX");
        if (closeX) closeX.focus();

        // Register Escape handler
        if (_escapeListener) {
            doc.removeEventListener("keydown", _escapeListener);
        }
        _escapeListener = (e) => {
            if (e.key === "Escape") {
                close();
            }
        };
        doc.addEventListener("keydown", _escapeListener);
    }

    function close() {
        const doc = getTargetDoc();
        const overlay = doc.getElementById(OVERLAY_ID);
        if (overlay) {
            overlay.classList.remove("def-preview-open");
        }

        // Restore body scroll
        if (_originalOverflow !== null && doc.body) {
            doc.body.style.overflow = _originalOverflow;
            _originalOverflow = null;
        }

        // Clean up escape listener
        if (_escapeListener) {
            doc.removeEventListener("keydown", _escapeListener);
            _escapeListener = null;
        }
    }

    function copyContent() {
        if (!_rawContent) return;

        const doc = getTargetDoc();
        const copyBtn = doc.getElementById("defPreviewCopyBtn");
        const copyText = doc.getElementById("defPreviewCopyText");

        function showSuccess() {
            if (copyBtn && copyText) {
                copyBtn.classList.add("def-preview-btn-success");
                copyText.textContent = "Copied!";
                setTimeout(() => {
                    copyBtn.classList.remove("def-preview-btn-success");
                    copyText.textContent = "Copy";
                }, 2000);
            }
        }

        function showFailure() {
            if (copyText) copyText.textContent = "Failed";
            setTimeout(() => {
                if (copyText) copyText.textContent = "Copy";
            }, 2000);
        }

        // Try Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(_rawContent)
                .then(showSuccess)
                .catch(() => fallbackCopy());
        } else {
            fallbackCopy();
        }

        function fallbackCopy() {
            try {
                const textArea = doc.createElement("textarea");
                textArea.value = _rawContent;
                textArea.style.position = "fixed";
                textArea.style.top = "-9999px";
                textArea.style.left = "-9999px";
                (doc.body || doc.documentElement).appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = doc.execCommand("copy");
                (doc.body || doc.documentElement).removeChild(textArea);

                if (successful) {
                    showSuccess();
                } else {
                    showFailure();
                }
            } catch (err) {
                showFailure();
            }
        }
    }

    function downloadContent() {
        if (!_rawContent) return;

        const doc = getTargetDoc();
        const ext = _currentFormat === "odatajson" ? "json" : "cs";
        const cleanEntityName = (_entityName || "entity").toLowerCase().replace(/[^a-z0-9_]/gi, "");
        const filename = `${cleanEntityName || "entity"}.${ext}`;
        const mimeType = _currentFormat === "odatajson" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8";

        try {
            const blob = new Blob([_rawContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = doc.createElement("a");
            a.href = url;
            a.download = filename;
            a.style.display = "none";
            (doc.body || doc.documentElement).appendChild(a);
            a.click();

            setTimeout(() => {
                if (a.parentNode) a.parentNode.removeChild(a);
                URL.revokeObjectURL(url);
            }, 150);
        } catch (err) {
            console.error("[EntityForgePreviewModal] Download failed:", err);
        }
    }

    return { open, close };
})();

// Request forwarder & Preview Modal message handler
if (!window.__DEF_MSG_LISTENER_REGISTERED__) {
    window.__DEF_MSG_LISTENER_REGISTERED__ = true;

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.type === "OPEN_ENTITY_FORGE_PREVIEW") {
            EntityForgePreviewModal.open(message);
            if (sendResponse) sendResponse({ status: "ok" });
            return true;
        }
        if (message && message.EntityGeneratorRequest) {
            window.postMessage(message, "*");
        }
    });
}
