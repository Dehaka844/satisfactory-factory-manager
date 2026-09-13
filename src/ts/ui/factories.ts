import {
    createFactory,
    getFactories,
    getFactoryById,
    updateFactory,
    deleteFactory,
    Factory
} from "../database/factories";

export interface FactoryUIOptions {
    reloadFactory: (factory: Factory) => Promise<void>;
    showWelcomeScreen: () => void;
}

let factoryList: HTMLDivElement | null = null;
let factoryDialog: HTMLDivElement | null = null;
let factoryForm: HTMLFormElement | null = null;
let factoryNameInput: HTMLInputElement | null = null;
let factoryDescriptionInput: HTMLTextAreaElement | null = null;

let deleteFactoryDialog: HTMLDivElement | null = null;
let deleteFactoryName: HTMLElement | null = null;

let cancelFactoryButton: HTMLButtonElement | null = null;
let newFactoryButton: HTMLButtonElement | null = null;

let cancelDeleteFactoryButton: HTMLButtonElement | null = null;
let confirmDeleteFactoryButton: HTMLButtonElement | null = null;

let factoryPendingDeletion: Factory | null = null;
let factoryBeingEdited: Factory | null = null;

let options: FactoryUIOptions | null = null;

export function configureFactoriesUI(
    uiOptions: FactoryUIOptions
): void {
    options = uiOptions;

    factoryList =
        document.querySelector<HTMLDivElement>(
            "#factory-list"
        );

    factoryDialog =
        document.querySelector<HTMLDivElement>(
            "#factory-dialog"
        );

    factoryForm =
        document.querySelector<HTMLFormElement>(
            "#factory-form"
        );

    factoryNameInput =
        document.querySelector<HTMLInputElement>(
            "#factory-name"
        );

    factoryDescriptionInput =
        document.querySelector<HTMLTextAreaElement>(
            "#factory-description"
        );

    deleteFactoryDialog =
        document.querySelector<HTMLDivElement>(
            "#delete-factory-dialog"
        );

    deleteFactoryName =
        document.querySelector<HTMLElement>(
            "#delete-factory-name"
        );

    cancelFactoryButton =
        document.querySelector<HTMLButtonElement>(
            "#cancel-factory-button"
        );

    newFactoryButton =
        document.querySelector<HTMLButtonElement>(
            "#new-factory-button"
        );

    cancelDeleteFactoryButton =
        document.querySelector<HTMLButtonElement>(
            "#cancel-delete-factory-button"
        );

    confirmDeleteFactoryButton =
        document.querySelector<HTMLButtonElement>(
            "#confirm-delete-factory-button"
        );

    setupEventListeners();
}

export function openFactoryDialog(
    factory: Factory | null = null
): void {
    if (!factoryDialog) {
        return;
    }

    if (!factoryForm) {
        return;
    }

    if (!factoryNameInput) {
        return;
    }

    if (!factoryDescriptionInput) {
        return;
    }

    factoryBeingEdited = factory;

    const dialogTitle =
        factoryDialog.querySelector(
            ".dialog-header h2"
        );

    const submitButton =
        factoryForm.querySelector<HTMLButtonElement>(
            'button[type="submit"]'
        );

    if (factory) {
        if (dialogTitle) {
            dialogTitle.textContent =
                "Editar fábrica";
        }

        factoryNameInput.value =
            factory.name;

        factoryDescriptionInput.value =
            factory.description;

        if (submitButton) {
            submitButton.textContent =
                "Guardar";
        }
    } else {
        if (dialogTitle) {
            dialogTitle.textContent =
                "Nueva fábrica";
        }

        factoryForm.reset();

        if (submitButton) {
            submitButton.textContent =
                "Crear";
        }
    }

    factoryDialog.classList.remove(
        "hidden"
    );

    factoryNameInput.focus();
}

function closeFactoryDialog(): void {
    if (!factoryDialog) {
        return;
    }

    factoryDialog.classList.add("hidden");

    factoryForm?.reset();

    factoryBeingEdited = null;
}

export function openDeleteFactoryDialog(factory: Factory) {
    if (!deleteFactoryDialog || !deleteFactoryName) {
        return;
    }

    factoryPendingDeletion = factory;

    deleteFactoryName.textContent = factory.name;

    deleteFactoryDialog.classList.remove("hidden");
}

function closeDeleteFactoryDialog(): void {
    if (!deleteFactoryDialog) {
        return;
    }

    deleteFactoryDialog.classList.add("hidden");

    factoryPendingDeletion = null;
}

export function renderFactories(
    factories: Factory[]
): void {
    if (!factoryList) {
        console.error(
            "No se encontró #factory-list"
        );

        return;
    }

    factoryList.innerHTML = "";

    for (const factory of factories) {
        const factoryButton =
            document.createElement(
                "button"
            );

        factoryButton.type = "button";

        factoryButton.className =
            "factory-item";

        factoryButton.dataset.factoryId =
            String(factory.id);

        factoryButton.innerHTML = `
            <span class="factory-icon">🏭</span>
            <span>${factory.name}</span>
        `;

        factoryButton.addEventListener(
            "click",
            async () => {
                const factoryId =
                    Number(
                        factoryButton.dataset.factoryId
                    );

                if (!factoryId) {
                    return;
                }

                try {
                    const factory =
                        await getFactoryById(
                            factoryId
                        );

                    if (!factory) {
                        console.error(
                            "No se encontró la fábrica:",
                            factoryId
                        );

                        return;
                    }

                    if (!options) {
                        return;
                    }

                    await options.reloadFactory(
                        factory
                    );

                } catch (error) {
                    console.error(
                        "Error cargando la fábrica:",
                        error
                    );
                }
            }
        );

        factoryList.appendChild(
            factoryButton
        );
    }
}

export async function loadFactories(): Promise<void>  {
    try {
        const factories = await getFactories();

        console.log("Fábricas cargadas:", factories);

        renderFactories(factories);
    } catch (error) {
        console.error(
            "Error cargando fábricas:",
            error
        );
    }
}

function setupEventListeners(): void {
    newFactoryButton?.addEventListener(
        "click",
        () => {
            openFactoryDialog();
        }
    );

    cancelFactoryButton?.addEventListener(
        "click",
        () => {
            closeFactoryDialog();
        }
    );

    factoryForm?.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            if (!factoryForm) {
                return;
            }

            const formData =
                new FormData(
                    factoryForm
                );

            const name =
                String(
                    formData.get("name") ?? ""
                ).trim();

            const description =
                String(
                    formData.get(
                        "description"
                    ) ?? ""
                ).trim();

            if (!name) {
                return;
            }

            const editingFactoryId =
                factoryBeingEdited?.id ??
                null;

            if (
                editingFactoryId !== null
            ) {
                await updateFactory(
                    editingFactoryId,
                    name,
                    description
                );
            } else {
                await createFactory(
                    name,
                    description
                );
            }

            closeFactoryDialog();

            const factories =
                await getFactories();

            renderFactories(
                factories
            );

            if (
                editingFactoryId !== null &&
                options
            ) {
                const updatedFactory =
                    await getFactoryById(
                        editingFactoryId
                    );

                if (updatedFactory) {
                    await options.reloadFactory(
                        updatedFactory
                    );
                }
            }
        }
    );

    confirmDeleteFactoryButton?.addEventListener(
        "click",
        async () => {
            if (!factoryPendingDeletion) {
                return;
            }

            const factory =
                factoryPendingDeletion;

            try {
                await deleteFactory(
                    factory.id
                );

                closeDeleteFactoryDialog();

                await loadFactories();

                options?.showWelcomeScreen();

            } catch (error) {
                console.error(
                    "Error eliminando fábrica:",
                    error
                );
            }
        }
    );

    cancelDeleteFactoryButton?.addEventListener(
        "click",
        () => {
            closeDeleteFactoryDialog();
        }
    );
}