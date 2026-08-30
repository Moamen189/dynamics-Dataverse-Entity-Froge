(() => {
    // Initialize theme first to avoid flash
    ThemeManager.initTheme().then(() => {
        const theme =
            document.documentElement.getAttribute("data-theme") || "light";
        switchHljsTheme(theme);
    });

    // Set initial status
    setConnectionStatus(
        "loading",
        "Connecting...",
        "Looking for a Dataverse form"
    );

    // Is this even Dynamics?
    try {
        workerRequest("GetBasicAttributes");
    } catch (err) {
        setConnectionStatus(
            "error",
            "Connection unavailable",
            "Unable to communicate with the extension worker"
        );
    }
})();

function enableButtons() {
    // Copy button
    document.getElementById("copyCode").addEventListener(
        "click",
        () => {
            if (!entityGenState.generatedCode) {
                showToast("Generate an entity first", "info");
                return;
            }
            navigator.clipboard
                .writeText(entityGenState.generatedCode)
                .then(() => {
                    signalStatus("copyCode", "SUCCESS");
                })
                .catch((err) => {
                    // console.error("Clipboard write failed:", err);
                    signalStatus("copyCode", "ERROR");
                });
        },
        false
    );

    // Format tabs
    document.querySelectorAll(".setFormatBtn").forEach((btn) => {
        btn.addEventListener(
            "click",
            ({ target }) => {
                const format = target.closest("[data-format]")
                    ? target.closest("[data-format]").getAttribute("data-format")
                    : null;

                if (!format || btn.disabled) return;

                entityGenState.format = format;
                render();
            },
            false
        );
    });

    // Download C# button
    document.getElementById("downloadCS").addEventListener("click", () => {
        DownloadHelper.downloadCS();
    });

    // Download JSON button
    document.getElementById("downloadJSON").addEventListener("click", () => {
        DownloadHelper.downloadJSON();
    });

    // Theme toggle
    document.getElementById("themeToggle").addEventListener("click", () => {
        ThemeManager.toggleTheme().then(() => {
            const theme =
                document.documentElement.getAttribute("data-theme") || "light";
            switchHljsTheme(theme);

            // Re-render code with new hljs theme if code exists
            if (entityGenState.generatedCodeToRender) {
                setCodeOutput(entityGenState.generatedCodeToRender);
            }
        });
    });

    // Field scope radios
    const formRadio = document.getElementById("fieldScopeForm");
    const allRadio = document.getElementById("fieldScopeAll");

    if (formRadio) {
        formRadio.addEventListener("change", () => {
            if (formRadio.checked) {
                entityGenState.onlyFormFields = true;
                entityGenState.hasAllFields = false;
                render();
            }
        });
    }

    if (allRadio) {
        allRadio.addEventListener("change", () => {
            if (allRadio.checked) {
                entityGenState.onlyFormFields = false;
                if (!entityGenState.hasAllFields) {
                    showLoadingOverlay("Reading all entity attributes...");
                    workerRequest("GetBasicAttributes");
                } else {
                    render();
                }
            }
        });
    }

    // Non-null checkbox
    const nonNullCheck = document.getElementById("nonNullCheck");
    if (nonNullCheck) {
        nonNullCheck.addEventListener("change", () => {
            entityGenState.onlyNonNull = nonNullCheck.checked;
            render();
        });
    }

    // Preview button
    const previewBtn = document.getElementById("previewBtn");
    if (previewBtn) {
        previewBtn.addEventListener("click", () => {
            PreviewManager.open();
        }, false);
    }
}

async function checkMetadata(origin) {
    let metadata = await EntityMetadataCache.getMetadata(origin);
    if (!metadata) {
        workerRequest("GetMetadata");
    } else {
        // console.log("Metadata - ", metadata);
        setEntitygenMetadata(metadata);
    }
}

function setEntitygenMetadata(metadata) {
    entityGenState.entitySetMappings = metadata.entitySetMappings;
    entityGenState.entitySetMappingsLastRefreshed = metadata.lastRefreshed;

    refreshJsonButton();
}

function newDataAvailable(response) {
    logPopup("New Data Available", response);
    if (response.type === "GetBasicAttributes") {
        const { entityName, entityId, attributes, params, origin } = response;

        if (!isValidPage(params)) {
            setConnectionStatus(
                "disconnected",
                "Not connected",
                "Open a Dataverse form to generate data"
            );
            return;
        }

        entityGenState.entityName = entityName;
        entityGenState.entityId = entityId;
        entityGenState.attributes = attributes;

        setConnectionStatus(
            "connected",
            "Connected",
            "Dataverse form detected"
        );

        render();
        enableButtons();
        hideWelcome();

        checkMetadata(origin);
    }

    if (response.type === "GetMetadata") {
        const metadataResponse = response;
        EntityMetadataCache.setMetadata(
            metadataResponse.origin,
            metadataResponse.metadata
        );
        setEntitygenMetadata(metadataResponse.metadata);
    }
}
