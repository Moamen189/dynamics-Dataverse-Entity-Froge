const ThemeManager = (() => {
    const STORAGE_KEY = "def_theme";
    const THEMES = ["light", "dark", "system"];

    function getSystemTheme() {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function applyTheme(theme) {
        const resolved = theme === "system" ? getSystemTheme() : theme;
        document.documentElement.setAttribute("data-theme", resolved);
        updateToggleIcon(resolved);
    }

    function updateToggleIcon(resolvedTheme) {
        const btn = document.getElementById("themeToggle");
        if (!btn) return;

        const sunIcon = btn.querySelector(".icon-sun");
        const moonIcon = btn.querySelector(".icon-moon");
        if (sunIcon && moonIcon) {
            sunIcon.style.display = resolvedTheme === "dark" ? "none" : "block";
            moonIcon.style.display = resolvedTheme === "dark" ? "block" : "none";
        }

        btn.setAttribute(
            "aria-label",
            resolvedTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
        );
        btn.setAttribute(
            "title",
            resolvedTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
        );
    }

    async function loadSavedTheme() {
        return new Promise((resolve) => {
            chrome.storage.local.get([STORAGE_KEY], (result) => {
                if (chrome.runtime.lastError) {
                    resolve("light");
                    return;
                }
                resolve(result[STORAGE_KEY] || "light");
            });
        });
    }

    async function saveTheme(theme) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [STORAGE_KEY]: theme }, () => {
                if (chrome.runtime.lastError) {
                }
                resolve();
            });
        });
    }

    async function initTheme() {
        const saved = await loadSavedTheme();
        applyTheme(saved);

        // Listen for system theme changes
        window
            .matchMedia("(prefers-color-scheme: dark)")
            .addEventListener("change", () => {
                loadSavedTheme().then((current) => {
                    if (current === "system") {
                        applyTheme("system");
                    }
                });
            });
    }

    async function toggleTheme() {
        const current = await loadSavedTheme();
        const next = current === "light" ? "dark" : "light";
        await saveTheme(next);
        applyTheme(next);
    }

    return { initTheme, toggleTheme, applyTheme, loadSavedTheme };
})();
