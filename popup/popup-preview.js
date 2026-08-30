/**
 * PreviewManager
 * Handles the Preview modal for Dataverse Entity Forge.
 *
 * Design principles:
 *  - Zero new generation logic. Reads entityGenState directly.
 *  - Reuses existing hljs, clipboard, signalStatus, and showToast patterns.
 *  - No additional API calls or Dataverse communication.
 */
const PreviewManager = (() => {
    const MODAL_ID       = "previewModal";
    const CODE_OUTPUT_ID = "previewCodeOutput";
    const CLOSE_BTN_ID   = "previewCloseBtn";
    const CLOSE_X_ID     = "previewCloseX";
    const COPY_BTN_ID    = "previewCopyBtn";

    let _escapeHandler = null;

    // ── Open ──────────────────────────────────────────────────────────────

    function open() {
        // Guard: nothing to preview yet
        if (!entityGenState.generatedCode) {
            showToast("No generated output available to preview.", "info");
            return;
        }

        const modal = document.getElementById(MODAL_ID);
        if (!modal) return;

        // Inject the already-rendered (escaped + tagged) HTML into the preview
        // code element — same pattern used by setCodeOutput() in popup-entitygen.js.
        const codeEl = document.getElementById(CODE_OUTPUT_ID);
        if (codeEl) {
            codeEl.innerHTML = entityGenState.generatedCodeToRender || "";
            delete codeEl.dataset.highlighted;

            // Apply the current hljs theme then highlight
            const currentTheme =
                document.documentElement.getAttribute("data-theme") || "light";
            switchHljsTheme(currentTheme);
            hljs.highlightAll();
        }

        // Show modal
        modal.hidden = false;

        // Trap focus on the X button for immediate keyboard accessibility
        const closeX = document.getElementById(CLOSE_X_ID);
        if (closeX) closeX.focus();

        // Register Escape key to close
        _escapeHandler = (e) => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("keydown", _escapeHandler);
    }

    // ── Close ─────────────────────────────────────────────────────────────

    function close() {
        const modal = document.getElementById(MODAL_ID);
        if (modal) modal.hidden = true;

        // Clean up Escape listener
        if (_escapeHandler) {
            document.removeEventListener("keydown", _escapeHandler);
            _escapeHandler = null;
        }
    }

    // ── Copy (mirrors popup-logic.js copy handler exactly) ────────────────

    function copy() {
        if (!entityGenState.generatedCode) {
            showToast("No generated output available to copy.", "info");
            return;
        }
        navigator.clipboard
            .writeText(entityGenState.generatedCode)
            .then(() => {
                signalStatus(COPY_BTN_ID, "SUCCESS");
            })
            .catch(() => {
                signalStatus(COPY_BTN_ID, "ERROR");
            });
    }

    // ── Wire up internal modal buttons ────────────────────────────────────

    function _bindModalButtons() {
        const closeBtn = document.getElementById(CLOSE_BTN_ID);
        const closeX   = document.getElementById(CLOSE_X_ID);
        const copyBtn  = document.getElementById(COPY_BTN_ID);

        if (closeBtn) closeBtn.addEventListener("click", close, false);
        if (closeX)   closeX.addEventListener("click", close, false);
        if (copyBtn)  copyBtn.addEventListener("click", copy, false);

        // Click on the backdrop (outside the card) also closes
        const modal = document.getElementById(MODAL_ID);
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) close();
            }, false);
        }
    }

    // Bind modal-internal buttons as soon as the DOM is ready.
    // popup-preview.js is loaded before popup-logic.js so DOMContentLoaded
    // is still safe to use here.
    document.addEventListener("DOMContentLoaded", _bindModalButtons);

    return { open, close };
})();
