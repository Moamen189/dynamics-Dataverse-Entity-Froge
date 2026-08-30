/**
 * SOURCE: Steve Harrison - Stack Overflow
 * https://stackoverflow.com/a/1026087
 */
function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function refreshJsonButton() {
    const jsonBtn = document.getElementById("formatBtnJSON");
    const spinner = document.getElementById("jsonSpinner");

    if (!jsonBtn || !spinner) return;

    if (entityGenState.entitySetMappings) {
        spinner.hidden = true;
        jsonBtn.disabled = false;
    } else {
        spinner.hidden = false;
        jsonBtn.disabled = true;
    }
}

function escapeHTML(str, backslashQuote) {
    if (typeof str !== "string") {
        return str;
    }

    const quoteReplace = backslashQuote ? "&#92;&quot;" : "&quot;";

    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, quoteReplace)
        .replace(/'/g, "&#39;");
}

function escapeDoubleQuotes(str) {
    if (typeof str !== "string") {
        return str;
    }

    return str.replace(/"/g, '""');
}

function escapeQuoteBackslash(str) {
    if (typeof str !== "string") {
        return str;
    }

    return str.replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function removeCurlyBraces(guid) {
    return guid.replace("{", "").replace("}", "");
}

function isValidPage(urlParams) {
    let params = new URLSearchParams(urlParams);
    return params.get("pagetype") == "entityrecord" && params.get("id");
}

function hideWelcome() {
    document.getElementById("welcomePage").style.display = "none";
    document.getElementById("mainPage").style.display = "block";
}

function showWelcome() {
    document.getElementById("welcomePage").style.display = "block";
    document.getElementById("mainPage").style.display = "none";
}

function setConnectionStatus(state, label, desc) {
    const banner = document.getElementById("statusBanner");
    const labelEl = document.getElementById("statusLabel");
    const descEl = document.getElementById("statusDesc");

    if (!banner) return;

    banner.className = `status-banner status-${state}`;
    if (labelEl) labelEl.textContent = label || "";
    if (descEl) descEl.textContent = desc || "";
}

function showLoadingOverlay(message) {
    const overlay = document.getElementById("loadingOverlay");
    if (!overlay) return;

    const textEl = overlay.querySelector(".loading-text");
    if (textEl) textEl.textContent = message || "Generating entity...";
    overlay.hidden = false;
}

function hideLoadingOverlay() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.hidden = true;
}

function setActionButtonsEnabled(enabled) {
    const copyBtn   = document.getElementById("copyCode");
    const dlCS      = document.getElementById("downloadCS");
    const dlJSON    = document.getElementById("downloadJSON");
    const previewBtn = document.getElementById("previewBtn");

    if (copyBtn)    copyBtn.disabled    = !enabled;
    if (dlCS)       dlCS.disabled       = !enabled;
    if (dlJSON)     dlJSON.disabled     = !enabled;
    if (previewBtn) previewBtn.disabled = !enabled;
}

function updateFormatTabs(activeFormat) {
    document.querySelectorAll(".seg-btn.setFormatBtn").forEach((btn) => {
        const fmt = btn.getAttribute("data-format");
        if (fmt === activeFormat) {
            btn.classList.add("seg-active");
            btn.setAttribute("aria-selected", "true");
        } else {
            btn.classList.remove("seg-active");
            btn.setAttribute("aria-selected", "false");
        }
    });
}

function switchHljsTheme(theme) {
    const link = document.getElementById("hljs-theme");
    if (!link) return;

    if (theme === "dark") {
        link.href = "highlight/github-dark.min.css";
    } else {
        link.href = "highlight/github.min.css";
    }
}
