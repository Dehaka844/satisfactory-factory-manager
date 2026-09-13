import {
    Factory
} from "./database/factories";

import {
    getSectionsByFactoryId,
} from "./database/sections";

import {
    createCatalogsButton,
    renderCatalogs
} from "./ui/catalogs";

import {
    renderProductionTable,
    renderFactoryResourceSummary
} from "./ui/production-view";

import {
    configureProductionStructureModal,
    openStructureModal,
    openDeleteStructureModal,
    openEditStructureModal
} from "./ui/production-structure-modal";

import {
    configureFactoriesUI,
    loadFactories,
    openFactoryDialog,
    openDeleteFactoryDialog
} from "./ui/factories";

import {
    configureSectionEditorUI,
    updateSectionEditorFactoryId,
    setupSectionEditorEvents
} from "./ui/section-editor";

import {
    configureFactoryImportUI,
    handleFactoryImport
} from "./ui/factory-import";

import {
    configureFactoryResourcesUI
} from "./ui/factory-resources";

import {
    configureFactoryExportUI
} from "./ui/factory-export";

import {
    configureDatabaseBackupUI
} from "./ui/database-backup";

import {
    getProductionStructuresByFactoryId,
    getFactoryResourceSummary,
} from "./database/production_queries";

import {
    startAutomaticBackups
} from "./database/database_backups";

console.log("Satisfactory Factory Manager iniciado");

const sidebarHeader =
    document.querySelector<HTMLElement>(".sidebar-header");

let currentFactory: Factory | null = null;

async function renderFactory(factory: Factory) {
    const content =
        document.querySelector<HTMLElement>("#content");

    if (!content) {
        console.error("No se encontró #content");
        return;
    }

    currentFactory = factory;

    const sections = await getSectionsByFactoryId(factory.id);

    const productionStructures = await getProductionStructuresByFactoryId(factory.id);

    const resourceSummary = await getFactoryResourceSummary(factory.id);

    content.innerHTML = `
        <div class="factory-view">

            <div class="factory-view-header">

                <div class="factory-title-row">

                    <div>
                        <h2>${factory.name}</h2>

                        ${
                            factory.description
                                ? `<p>${factory.description}</p>`
                                : ""
                        }
                    </div>

                    <div class="factory-actions">

                        <button
                            id="edit-factory-button"
                            class="edit-factory-button"
                            type="button"
                        >
                            ✏️ Editar
                        </button>

                        <button
                            type="button"
                            class="factory-export-button"
                            data-export-factory="${factory.id}"
                        >
                            📤 Exportar
                        </button>
                        
                        <button
                            id="delete-factory-button"
                            class="delete-factory-button"
                            type="button"
                        >
                            🗑️ Eliminar
                        </button>
                    
                    </div>

                </div>

            </div>

            <div class="factory-view-body">

                ${renderProductionTable(productionStructures)}

                ${renderFactoryResourceSummary(resourceSummary)}

                ${
                    sections.length === 0
                        ? `
                            <div class="empty-factory">

                                <div class="empty-factory-icon">
                                    🏗️
                                </div>

                                <h3>Fábrica vacía</h3>

                                <p>
                                    Aquí construiremos el contenido
                                    de producción de esta fábrica.
                                </p>

                            </div>
                        `
                        : `
                            <div class="sections-list">

                                ${sections
                                    .map(
                                        (section) => `
                                            <div
                                                class="section-card"
                                                data-section-id="${section.id}"
                                            >
                                                <div class="section-card-header">
                                                    <h3>
                                                        📄 ${section.title || "Sin título"}
                                                    </h3>

                                                    <button
                                                        type="button"
                                                        class="delete-section-button"
                                                        data-section-id="${section.id}"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>

                                                <div class="section-card-content">
                                                    <div class="section-editor">

                                                        <div class="section-toolbar">

                                                            <button
                                                                type="button"
                                                                class="editor-button"
                                                                data-command="formatBlock"
                                                                data-value="h1"
                                                                title="Título 1"
                                                            >
                                                                H1
                                                            </button>

                                                            <button
                                                                type="button"
                                                                class="editor-button"
                                                                data-command="formatBlock"
                                                                data-value="h2"
                                                                title="Título 2"
                                                            >
                                                                H2
                                                            </button>

                                                            <button
                                                                type="button"
                                                                class="editor-button"
                                                                data-command="formatBlock"
                                                                data-value="h3"
                                                                title="Título 3"
                                                            >
                                                                H3
                                                            </button>

                                                            <span class="editor-toolbar-separator"></span>

                                                            <button
                                                                type="button"
                                                                class="editor-button editor-button-bold"
                                                                data-command="bold"
                                                                title="Negrita"
                                                            >
                                                                B
                                                            </button>

                                                            <button
                                                                type="button"
                                                                class="editor-button editor-button-italic"
                                                                data-command="italic"
                                                                title="Cursiva"
                                                            >
                                                                I
                                                            </button>

                                                            <button
                                                                type="button"
                                                                class="editor-button editor-button-underline"
                                                                data-command="underline"
                                                                title="Subrayado"
                                                            >
                                                                U
                                                            </button>

                                                            <span class="editor-toolbar-separator"></span>

                                                            <button
                                                                type="button"
                                                                class="editor-button"
                                                                data-command="insertUnorderedList"
                                                                title="Lista"
                                                            >
                                                                •
                                                            </button>

                                                            <button
                                                                type="button"
                                                                class="editor-button"
                                                                data-command="insertOrderedList"
                                                                title="Lista numerada"
                                                            >
                                                                1.
                                                            </button>

                                                        </div>

                                                        <div
                                                            class="section-editor-content"
                                                            contenteditable="true"
                                                            data-section-id="${section.id}"
                                                        >${section.content}</div>

                                                    </div>
                                                </div>
                                            </div>
                                        `
                                    )
                                    .join("")}

                            </div>
                        `
                }

                <button
                    type="button"
                    id="add-section-button"
                    class="add-section-button"
                >
                    ＋ Añadir sección
                </button>

            </div>

        </div>
    `;

    const editButton =
        document.querySelector<HTMLButtonElement>("#edit-factory-button");

    editButton?.addEventListener("click", () => {
        openFactoryDialog(factory);
    });

    const deleteButton =
        document.querySelector<HTMLButtonElement>("#delete-factory-button");

    deleteButton?.addEventListener("click", () => {
        openDeleteFactoryDialog(factory);
    });

    const newStructureButton =
        document.querySelector<HTMLButtonElement>("#new-structure-button");

    newStructureButton?.addEventListener("click", () => {
        void openStructureModal(
            factory.id
        );
    });

    updateSectionEditorFactoryId(
        factory.id
    );

    setupSectionEditorEvents(
        sections
    );

    const productionToggleButtons =
        document.querySelectorAll<HTMLButtonElement>(
            "[data-production-toggle]"
        );

    productionToggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const productionId =
                Number(
                    button.dataset.productionToggle
                );

            if (!productionId) {
                return;
            }

            const detailRow =
                document.querySelector<HTMLTableRowElement>(
                    `[data-production-detail="${productionId}"]`
                );

            if (!detailRow) {
                return;
            }

            const isOpen = !detailRow.hidden;

            detailRow.hidden = isOpen;

            button.setAttribute(
                "aria-expanded",
                String(!isOpen)
            );

            button.textContent = isOpen
                ? "▶"
                : "▼";
        });
    });

    const productionEditButtons =
        document.querySelectorAll<HTMLButtonElement>(
            "[data-production-edit]"
        );

    productionEditButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const structureId =
                Number(
                    button.dataset.productionEdit
                );

            if (!structureId) {
                return;
            }

            void openEditStructureModal(
                structureId
            );
        });
    });

    const productionDeleteButtons =
        document.querySelectorAll<HTMLButtonElement>(
            "[data-production-delete]"
        );

    productionDeleteButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const structureId =
                Number(
                    button.dataset.productionDelete
                );

            void openDeleteStructureModal(
                structureId
            );
        });
    });

}

configureProductionStructureModal({
    getCurrentFactoryId: () => {
        return currentFactory?.id ?? null;
    },

    reloadFactory: async () => {
        if (!currentFactory) {
            return;
        }

        await renderFactory(currentFactory);
    }
});

configureFactoriesUI({
    reloadFactory: async (factory) => {
        currentFactory = factory;
        await renderFactory(factory);
    },

    showWelcomeScreen: () => {
        currentFactory = null;

        const content =
            document.querySelector<HTMLElement>(
                "#content"
            );

        if (content) {
            content.innerHTML = `
                <div class="welcome-screen">

                    <div class="welcome-icon">
                        🏭
                    </div>

                    <h2>Bienvenido</h2>

                    <p>
                        Selecciona una fábrica para comenzar.
                    </p>

                </div>
            `;
        }
    }
});

configureSectionEditorUI({
    getCurrentFactoryId: () => {
        return currentFactory?.id ?? null;
    },

    reloadFactory: async () => {
        if (!currentFactory) {
            return;
        }

        await renderFactory(
            currentFactory
        );
    }
});

configureFactoryImportUI({
    reloadFactories: async () => {
        await loadFactories();
    }
});

configureFactoryResourcesUI({
    getCurrentFactoryId: () => {
        return currentFactory?.id ?? null;
    },

    reloadFactory: async () => {
        if (!currentFactory) {
            return;
        }

        await renderFactory(
            currentFactory
        );
    }
});

configureFactoryExportUI({
    getCurrentFactoryId: () => {
        return currentFactory?.id ?? null;
    }
});

configureDatabaseBackupUI();

document.addEventListener(
    "click",
    async (event) => {

        const target =
            event.target;

        if (
            !(target instanceof HTMLElement)
        ) {
            return;
        }

        const importButton =
            target.closest<HTMLElement>(
                "#import-factory-button"
            );

        if (!importButton) {
            return;
        }

        await handleFactoryImport();
    }
);

if (sidebarHeader) {
    createCatalogsButton(
        sidebarHeader,
        () => {
            currentFactory = null;
            renderCatalogs();
        }
    );
}

void loadFactories();

void startAutomaticBackups();