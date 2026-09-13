import {
    getResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource,
    Resource
} from "../database/resources";

import {
    getMachines,
    getMachineById,
    createMachine,
    updateMachine,
    deleteMachine,
    Machine
} from "../database/machines";

import {
    getRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    Recipe
} from "../database/recipes";

export type CatalogType =
    | "resources"
    | "machines"
    | "recipes";

let activeCatalog: CatalogType = "resources";

export function createCatalogsButton(
    sidebarHeader: HTMLElement,
    onOpenCatalogs: () => void
): void {
    if (
        document.getElementById(
            "catalogs-button"
        )
    ) {
        return;
    }

    const button =
        document.createElement("button");

    button.type = "button";
    button.id = "catalogs-button";
    button.className =
        "catalogs-navigation-button";

    button.textContent =
        "⚙️ Catálogos";

    button.addEventListener(
        "click",
        () => {
            onOpenCatalogs();
        }
    );

    sidebarHeader.appendChild(
        button
    );
}

export function renderCatalogs(): void {
    const content =
        document.querySelector<HTMLElement>(
            "#content"
        );

    if (!content) {
        console.error(
            "No se encontró #content"
        );

        return;
    }

    content.innerHTML = `
        <div class="catalogs-view">

            <div class="catalogs-view-header">

                <div>
                    <h2>Catálogos</h2>

                    <p>
                        Administra los recursos,
                        máquinas y recetas disponibles
                        en la aplicación.
                    </p>
                </div>

                <button
                    type="button"
                    id="new-catalog-entry-button"
                    class="primary-button"
                >
                    📌 Nueva entrada
                </button>

            </div>

            <div class="catalog-tabs">

                <button
                    type="button"
                    class="catalog-tab active"
                    data-catalog-tab="resources"
                >
                    Recursos
                </button>

                <button
                    type="button"
                    class="catalog-tab"
                    data-catalog-tab="machines"
                >
                    Máquinas
                </button>

                <button
                    type="button"
                    class="catalog-tab"
                    data-catalog-tab="recipes"
                >
                    Recetas
                </button>

            </div>

            <div
                id="catalog-content"
                class="catalog-content"
            ></div>

        </div>
    `;

    setupCatalogEvents();

    void renderCatalogEntries(
        "resources"
    );
}

function setupCatalogEvents(): void {
    activeCatalog = "resources";

    const tabs =
        document.querySelectorAll<HTMLButtonElement>(
            "[data-catalog-tab]"
        );

    tabs.forEach((tab) => {
        tab.addEventListener(
            "click",
            () => {
                const catalog =
                    tab.dataset.catalogTab;

                if (
                    catalog !== "resources" &&
                    catalog !== "machines" &&
                    catalog !== "recipes"
                ) {
                    return;
                }

                tabs.forEach(
                    (currentTab) => {
                        currentTab.classList.toggle(
                            "active",
                            currentTab === tab
                        );
                    }
                );

                activeCatalog = catalog;

                void renderCatalogEntries(
                    catalog
                );
            }
        );
    });

    const newButton =
        document.querySelector<HTMLButtonElement>(
            "#new-catalog-entry-button"
        );

    newButton?.addEventListener(
        "click",
        () => {
            openCatalogModal(
                activeCatalog
            );
        }
    );
}

async function renderCatalogEntries(
    type: CatalogType
): Promise<void> {
    const container =
        document.querySelector<HTMLElement>(
            "#catalog-content"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="catalog-loading">
            Cargando...
        </div>
    `;

    try {
        let rows: Array<{
            id: number;
            name: string;
        }> = [];

        if (type === "resources") {
            rows = await getResources();
        }

        if (type === "machines") {
            rows = await getMachines();
        }

        if (type === "recipes") {
            rows = await getRecipes();
        }

        if (rows.length === 0) {
            container.innerHTML = `
                <div class="catalog-empty">
                    <div class="catalog-empty-icon">
                        📦
                    </div>

                    <h3>No hay entradas</h3>

                    <p>
                        Todavía no hay elementos
                        en este catálogo.
                    </p>
                </div>
            `;

            return;
        }

        const catalogLabel = getCatalogLabel(type);

        container.innerHTML = `
            <div class="catalog-table-wrapper">

                <table class="catalog-table">

                    <thead>
                        <tr>
                            <th>${catalogLabel}</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows
                            .map(
                                (row) => `
                                    <tr>
                                        <td>
                                            <strong>
                                                ${row.name}
                                            </strong>
                                        </td>

                                        <td>
                                            <div class="catalog-row-actions">

                                                <button
                                                    type="button"
                                                    class="secondary-button"
                                                    data-catalog-edit="${row.id}"
                                                >
                                                    ✏️ Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    class="dialog-button danger"
                                                    data-catalog-delete="${row.id}"
                                                >
                                                    🗑️ Eliminar
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                `
                            )
                            .join("")}
                    </tbody>

                </table>

            </div>
        `;

        setupCatalogRowEvents(
            type
        );

    } catch (error) {
        console.error(
            "Error cargando catálogo:",
            error
        );

        container.innerHTML = `
            <div class="catalog-error">
                No se pudo cargar el catálogo.
            </div>
        `;
    }
}

function setupCatalogRowEvents(
    type: CatalogType
): void {
    const editButtons =
        document.querySelectorAll<HTMLButtonElement>(
            "[data-catalog-edit]"
        );

    editButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                async () => {
                    const id =
                        Number(
                            button.dataset.catalogEdit
                        );

                    if (!id) {
                        return;
                    }

                    try {
                        let entry:
                            | Resource
                            | Machine
                            | Recipe
                            | null = null;

                        if (
                            type === "resources"
                        ) {
                            entry =
                                await getResourceById(
                                    id
                                );
                        }

                        if (
                            type === "machines"
                        ) {
                            entry =
                                await getMachineById(
                                    id
                                );
                        }

                        if (
                            type === "recipes"
                        ) {
                            entry =
                                await getRecipeById(
                                    id
                                );
                        }

                        if (!entry) {
                            return;
                        }

                        openCatalogModal(
                            type,
                            entry.id,
                            entry.name
                        );

                    } catch (error) {
                        console.error(
                            "Error obteniendo entrada del catálogo:",
                            error
                        );
                    }
                }
            );
        }
    );

    const deleteButtons =
        document.querySelectorAll<HTMLButtonElement>(
            "[data-catalog-delete]"
        );

    deleteButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                async () => {
                    const id =
                        Number(
                            button.dataset.catalogDelete
                        );

                    if (!id) {
                        return;
                    }

                    await deleteCatalogEntry(
                        type,
                        id
                    );
                }
            );
        }
    );
}

function getCatalogLabel(
    type: CatalogType
): string {
    if (type === "resources") {
        return "Recurso";
    }

    if (type === "machines") {
        return "Máquina";
    }

    return "Receta";
}

function openCatalogModal(
    type: CatalogType,
    id: number | null = null,
    currentName = ""
): void {
    activeCatalog = type;

    const isEditing =
        id !== null;

    const label =
        getCatalogLabel(type);

    const existingModal =
        document.querySelector<HTMLElement>(
            "#catalog-modal"
        );

    existingModal?.remove();

    const modal =
        document.createElement("div");

    modal.id = "catalog-modal";
    modal.className = "modal-overlay modal-visible";

    modal.innerHTML = `
        <div class="catalog-modal">

            <div class="modal-header">
                <h2>
                    ${
                        isEditing
                            ? `Editar ${label.toLowerCase()}`
                            : `Nuevo ${label.toLowerCase()}`
                    }
                </h2>

                <button
                    type="button"
                    class="modal-close-button"
                    id="catalog-modal-close"
                >
                    ×
                </button>
            </div>

            <form id="catalog-form">

                <div class="modal-body">

                    <div class="form-group">

                        <label for="catalog-name">
                            Nombre
                        </label>

                        <input
                            id="catalog-name"
                            name="name"
                            type="text"
                            value="${currentName}"
                            autocomplete="off"
                            required
                            maxlength="200"
                        />

                    </div>

                    <div
                        id="catalog-form-error"
                        class="form-error"
                        hidden
                    ></div>

                </div>

                <div class="modal-footer">

                    <button
                        type="button"
                        class="dialog-button secondary"
                        id="catalog-modal-cancel"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="dialog-button primary"
                    >
                        ${isEditing ? "Guardar cambios" : "Crear"}
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    const input =
        modal.querySelector<HTMLInputElement>(
            "#catalog-name"
        );

    input?.focus();

    const close = () => {
        modal.remove();
    };

    modal
        .querySelector<HTMLButtonElement>(
            "#catalog-modal-close"
        )
        ?.addEventListener(
            "click",
            close
        );

    modal
        .querySelector<HTMLButtonElement>(
            "#catalog-modal-cancel"
        )
        ?.addEventListener(
            "click",
            close
        );

    modal.addEventListener(
        "click",
        (event) => {
            if (event.target === modal) {
                close();
            }
        }
    );

    const form =
        modal.querySelector<HTMLFormElement>(
            "#catalog-form"
        );

    form?.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const name =
                input?.value.trim() ?? "";

            if (!name) {
                showCatalogFormError(
                    "El nombre no puede estar vacío."
                );

                input?.focus();

                return;
            }

            await saveCatalogEntry(
                type,
                name,
                id,
                close
            );
        }
    );
}

function showCatalogFormError(
    message: string
): void {
    const error =
        document.querySelector<HTMLElement>(
            "#catalog-form-error"
        );

    if (!error) {
        return;
    }

    error.textContent = message;
    error.hidden = false;
}

async function saveCatalogEntry(
    type: CatalogType,
    name: string,
    id: number | null,
    closeModal: () => void
): Promise<void> {
    const submitButton =
        document.querySelector<HTMLButtonElement>(
            "#catalog-form button[type='submit']"
        );

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        if (id === null) {
            if (type === "resources") {
                await createResource(name);
            }

            if (type === "machines") {
                await createMachine(name);
            }

            if (type === "recipes") {
                await createRecipe(name);
            }
        } else {
            if (type === "resources") {
                await updateResource(
                    id,
                    name
                );
            }

            if (type === "machines") {
                await updateMachine(
                    id,
                    name
                );
            }

            if (type === "recipes") {
                await updateRecipe(
                    id,
                    name
                );
            }
        }

        closeModal();

        await renderCatalogEntries(
            type
        );

    } catch (error) {
        console.error(
            "Error guardando entrada del catálogo:",
            error
        );

        showCatalogFormError(
            getCatalogDatabaseErrorMessage(
                error
            )
        );

        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}

function getCatalogDatabaseErrorMessage(
    error: unknown
): string {
    const message =
        error instanceof Error
            ? error.message
            : String(error);

    if (
        message.includes("UNIQUE") ||
        message.includes("unique")
    ) {
        return "Ya existe una entrada con ese nombre.";
    }

    return "No se pudo guardar la entrada.";
}

async function deleteCatalogEntry(
    type: CatalogType,
    id: number
): Promise<void> {
    const label =
        getCatalogLabel(type);

    let entry:
        | Resource
        | Machine
        | Recipe
        | null = null;

    try {
        if (type === "resources") {
            entry =
                await getResourceById(id);
        }

        if (type === "machines") {
            entry =
                await getMachineById(id);
        }

        if (type === "recipes") {
            entry =
                await getRecipeById(id);
        }

        if (!entry) {
            return;
        }

        openCatalogDeleteModal(
            type,
            id,
            entry.name,
            label
        );

    } catch (error) {
        console.error(
            "Error obteniendo entrada del catálogo:",
            error
        );
    }
}

function openCatalogDeleteModal(
    type: CatalogType,
    id: number,
    name: string,
    label: string
): void {
    document
        .querySelector<HTMLElement>(
            "#catalog-delete-modal"
        )
        ?.remove();

    const modal =
        document.createElement("div");

    modal.id =
        "catalog-delete-modal";

    modal.className =
        "modal-overlay modal-visible";

    modal.innerHTML = `
        <div class="catalog-delete-modal">

            <div class="modal-header">

                <h2>
                    Eliminar ${label.toLowerCase()}
                </h2>

                <button
                    type="button"
                    class="modal-close-button"
                    id="catalog-delete-close"
                >
                    ×
                </button>

            </div>

            <div class="modal-body">

                <p>
                    ¿Seguro que quieres eliminar
                    <strong>${name}</strong>?
                </p>

                <p class="delete-warning">
                    Esta operación no se puede deshacer.
                </p>

            </div>

            <div class="modal-footer">

                <button
                    type="button"
                    class="dialog-button secondary"
                    id="catalog-delete-cancel"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    class="dialog-button danger"
                    id="catalog-delete-confirm"
                >
                    Eliminar
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    const close = () => {
        modal.remove();
    };

    modal
        .querySelector<HTMLButtonElement>(
            "#catalog-delete-close"
        )
        ?.addEventListener(
            "click",
            close
        );

    modal
        .querySelector<HTMLButtonElement>(
            "#catalog-delete-cancel"
        )
        ?.addEventListener(
            "click",
            close
        );

    modal.addEventListener(
        "click",
        (event) => {
            if (event.target === modal) {
                close();
            }
        }
    );

    modal
        .querySelector<HTMLButtonElement>(
            "#catalog-delete-confirm"
        )
        ?.addEventListener(
            "click",
            async () => {
                const button =
                    modal.querySelector<HTMLButtonElement>(
                        "#catalog-delete-confirm"
                    );

                if (button) {
                    button.disabled = true;
                }

                try {
                    await performCatalogDelete(
                        type,
                        id,
                        modal
                    );
                } catch (error) {
                    console.error(
                        "Error eliminando entrada del catálogo:",
                        error
                    );

                    if (button) {
                        button.disabled = false;
                    }

                    showCatalogDeleteErrorModal(
                        type,
                        error
                    );
                }
            }
        );
}

function showCatalogDeleteErrorModal(
    type: CatalogType,
    error: unknown
): void {
    const message =
        error instanceof Error
            ? error.message
            : String(error);

    console.error(
        "Detalle del error SQLite:",
        message
    );

    const isForeignKeyError =
        message.includes("FOREIGN KEY") ||
        message.includes("foreign key");

    const label =
        getCatalogLabel(type);

    const description =
        isForeignKeyError
            ? (
                `No se puede eliminar este ` +
                `${label.toLowerCase()} porque ` +
                "está siendo utilizado en una o más fábricas."
            )
            : (
                "No se pudo eliminar la entrada " +
                "del catálogo."
            );

    document
        .querySelector<HTMLElement>(
            "#catalog-delete-modal"
        )
        ?.remove();

    document
        .querySelector<HTMLElement>(
            "#catalog-delete-error-modal"
        )
        ?.remove();

    const modal =
        document.createElement("div");

    modal.id =
        "catalog-delete-error-modal";

    modal.className =
        "modal-overlay modal-visible";

    modal.innerHTML = `
        <div class="catalog-delete-error-modal">

            <div class="modal-header">

                <h2>
                    No se puede eliminar
                </h2>

                <button
                    type="button"
                    class="modal-close-button"
                    id="catalog-delete-error-close"
                >
                    ×
                </button>

            </div>

            <div class="modal-body">

                <p>
                    ${description}
                </p>

                ${
                    isForeignKeyError
                        ? `
                            <p class="delete-warning">
                                Primero elimina o modifica
                                las referencias que utilizan
                                este elemento.
                            </p>
                        `
                        : ""
                }

            </div>

            <div class="modal-footer">

                <button
                    type="button"
                    class="dialog-button primary"
                    id="catalog-delete-error-ok"
                >
                    Aceptar
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    const close = () => {
        modal.remove();
    };

    modal
        .querySelector<HTMLButtonElement>(
            "#catalog-delete-error-close"
        )
        ?.addEventListener(
            "click",
            close
        );

    modal
        .querySelector<HTMLButtonElement>(
            "#catalog-delete-error-ok"
        )
        ?.addEventListener(
            "click",
            close
        );

    modal.addEventListener(
        "click",
        (event) => {
            if (event.target === modal) {
                close();
            }
        }
    );
}

async function performCatalogDelete(
    type: CatalogType,
    id: number,
    modal: HTMLElement
): Promise<void> {
    if (type === "resources") {
        await deleteResource(id);
    }

    if (type === "machines") {
        await deleteMachine(id);
    }

    if (type === "recipes") {
        await deleteRecipe(id);
    }

    modal.remove();

    await renderCatalogEntries(
        type
    );
}