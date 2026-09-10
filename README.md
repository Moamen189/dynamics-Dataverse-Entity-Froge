# 🛠️ Dataverse Entity Forge

![Dataverse Entity Forge Cover](icons/Dataverse%20Entity%20Forge%20Cover.png)

**Dataverse Entity Forge** is a modern, high-productivity developer utility extension for Google Chrome and Microsoft Edge. It is designed to assist Microsoft Power Apps, Dataverse, and Dynamics 365 developers in instantly generating test data representation and entity metadata scripts directly from active record forms.

Whether you are writing C# unit tests using `XrmRealTime` or the standard SDK, or building front-end OData integrations, Dataverse Entity Forge automates the manual translation of form values into C# code or OData-compliant JSON structures.

---

## 🚀 Key Features

- **⚡ Instant Code Generation**: Instantly parses the active entity record form to extract populated field attributes and metadata.
- **💻 C# Entity Representation**: Generates standard SDK-compatible C# `Entity` initialization scripts (e.g. `new Entity("account") { ["name"] = "Acme Corp" }`).
- **🌐 JSON (OData) Output**: Resolves relational lookups and Choice option labels into raw OData-bindable JSON payloads for API requests.
- **💾 Direct File Downloads**: Download generated configurations directly from the popup or Preview modal:
    - **C#** saves as `<entity-logical-name>.cs` (e.g. `account.cs`)
    - **JSON** saves as `<entity-logical-name>.json` (e.g. `account.json`)
- **📂 Scope Control**: Toggle between generating code only for fields currently present on the active form layout (**Form fields**), or pull all attributes available on the entity (**All fields**).
- **🚫 Value Filtering**: Exclude empty fields via the **Non-null only** checkbox, or turn it off to generate explicit `null` placeholders.
- **🖥️ Full-Page Centered Preview Modal**: Opens a large, fixed-position, high-contrast modal overlay directly on top of the active Dynamics 365 page with backdrop blur (`backdrop-filter: blur(3px)`).
    - **In-Modal Theme Toggle**: Easily switch between Light and Dark themes directly inside the Preview Modal header.
    - **In-Modal Download & Copy**: Download C# / JSON files or copy code to clipboard with visual `"Copied!"` feedback directly from the modal footer.
    - **Hardware-Accelerated 60fps Scrolling**: Optimized CSS containment (`contain: layout style paint`) and scroll isolation for ultra-smooth scrolling on large entity definitions.
    - **Style Isolation**: All modal elements are strictly scoped under `.def-preview-overlay` with maximum z-index positioning (`z-index: 2147483647`), completely immune to page CSS conflicts.
- **🌓 Adaptive Theme**: Fully supports professional **Light** and **Dark** modes across the extension popup and preview modal, with choice persistence via `chrome.storage.local`.
- **🔔 Toast Notifications**: Includes built-in toast alerts for clear feedback (e.g., download confirmations, copy successes) that stay out of the way.

---

## 📊 Supported Attribute Types

Dataverse Entity Forge automatically maps complex Microsoft Dataverse field types to their corresponding C# and JSON representation:

| Attribute Type            | C# Output Representation               | JSON (OData) Output Representation            |
| :------------------------ | :------------------------------------- | :-------------------------------------------- |
| **String / Memo**         | `@"escaped string"`                    | `"escaped string"`                            |
| **Boolean**               | `true` / `false`                       | `true` / `false`                              |
| **Money**                 | `new Money(value)`                     | `value` (numeric)                             |
| **Decimal / Double**      | `value` / `valueM`                     | `value` (numeric)                             |
| **DateTime**              | `DateTime.Parse("ISO String")`         | `"ISO-8601 String"`                           |
| **Lookup (Relationship)** | `new EntityReference("entity", guid)`  | `"fieldname@odata.bind": "/entitysets(guid)"` |
| **OptionSet (Choice)**    | `new OptionSetValue(code)`             | `code` (numeric)                              |
| **MultiSelect OptionSet** | `new OptionSetValueCollection(...)`    | `[code1, code2, code3]`                       |
| **File / Image**          | Resolves name, GUID, and download URLs | Resolves corresponding record properties      |

---

## 🛠️ Step-by-Step Installation

Since Dataverse Entity Forge is a developer utility, it is loaded unpacked:

1. **Download/Clone**: Clone this repository or download the ZIP file and extract it to a directory of your choice.
2. **Open Extensions Page**:
    - In Google Chrome, go to `chrome://extensions/`
    - In Microsoft Edge, go to `edge://extensions/`
3. **Enable Developer Mode**: Turn on the **Developer mode** toggle switch in the top right (or bottom left in older layouts).
4. **Load Extension**: Click the **Load unpacked** button and select the root directory of this repository (the folder containing `manifest.json`).
5. **Pin Extension**: Click the extension puzzle icon in the browser toolbar and pin **Dataverse Entity Forge** to your toolbar for easy access.

---

## 📖 Usage Guide

### 1. Detect Entity Form

Open any Microsoft Dynamics 365 or Dataverse model-driven app record page (e.g. an Account form, Contact record, or custom table form). The page URL parameters must include `pagetype=entityrecord` and a valid record `id`.

### 2. Launch Extension

Click the **Dataverse Entity Forge** icon on the browser toolbar. The extension will automatically establish a secure communication channel with the page worker, verify connection status, and read form metadata.

### 3. Configure Output Parameters

- **Output Format**: Click the **C#** or **JSON** buttons to switch formats.
- **Fields Filter**: Select **Form fields** (only fields rendered on the active form) or **All fields** (queries full client attributes).
- **Data Toggle**: Toggle **Non-null only** to exclude empty values or include them as standard `null` declarations.
- **Preview Output**: Click the **Preview** button to launch the full-page centered modal overlay directly inside your active Dynamics 365 page.
    - Inspect syntax-highlighted C# or JSON code.
    - Toggle Light/Dark mode via the sun/moon icon in the modal header.
    - Click **Download C#** / **Download JSON** in the modal footer to export files directly.
    - Click **Copy** to copy raw code to clipboard with visual feedback.
    - Close the modal by clicking the `✕` icon, the footer **Close** button, clicking the backdrop outside the modal, or pressing `Escape`.

### 4. Copy or Download

- Click **Copy** in popup or preview to save code directly to your clipboard.
- Click **C#** or **JSON** download buttons in popup or preview to export `.cs` or `.json` files instantly.

---

## 🏗️ Technical Architecture

The extension uses a secure four-tier architecture designed for isolated DOM manipulation, high-contrast modal rendering, and Dataverse API context safety:

```
┌────────────────────────────────┐
│         Popup UI Context       │
│  (popup.html, popup-logic.js)  │
│  - Builds code configurations  │
│  - Triggers Preview modal msg  │
└────────────────┬───────────────┘
                 │
       chrome.tabs.sendMessage
                 │
 ┌───────────────v───────────────┐
 │      Content Script Bridge    │
 │ (content.js & preview-modal)  │
 │  - Renders Page Modal Overlay │
 │  - Syntax highlighting (HL.js)│
 │  - Fallback Clipboard & Export│
 └───────────────┬───────────────┘
                 │
          window.postMessage
                 │
 ┌───────────────v───────────────┐
 │     Injected Page Worker      │
 │          (worker.js)          │
 │  - Executes in page context   │
 │  - Direct client-API access   │
 │  - Queries Dataverse metadata │
 └───────────────────────────────┘
```

1. **Injected Page Worker (`worker.js`)**: Executes inside the page DOM to gain direct access to the client API framework context (`Xrm.Page`). It collects attribute names, field values, entity names, and queries metadata mappings (via the `/api/data/v9.2/$metadata` OData Web API endpoint).
2. **Content Script Bridge & Modal Renderer (`content.js`, `preview-modal.css`)**: Listens to messages from the popup. When receiving `OPEN_ENTITY_FORGE_PREVIEW`, it injects and manages `EntityForgePreviewModal` on `window.top.document.body` as a fixed-position centered overlay (`.def-preview-overlay`) with backdrop blur, scroll containment, and fallback clipboard/download operations.
3. **Popup Manager (`popup-logic.js`, `popup-preview.js` & helpers)**: Computes C# syntax structures or maps OData bind collections based on user configurations. If the active tab has not initialized content scripts yet, `popup-preview.js` automatically uses `chrome.scripting` to inject `preview-modal.css`, `highlight.min.js`, and `content.js` dynamically without asking the user to refresh the page.

### 💾 Caching and Performance

To avoid hitting the Dataverse Metadata API repeatedly on form loads:

- Entity Set OData Bindings are automatically cached locally using **Chrome Storage (`chrome.storage.local`)**.
- Cache TTL is set to **5 days**. The cache automatically evicts the least recently used (LRU) entity records if storage usage approaches the **5MB** limit.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
