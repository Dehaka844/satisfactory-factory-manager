import {
    getResources,
    Resource
} from "../database/resources";

import {
    getMachines,
    Machine
} from "../database/machines";

import {
    getRecipes,
    Recipe
} from "../database/recipes";

import {
    createProductionStructure,
    updateProductionStructure,
    deleteProductionStructure
} from "../database/production";

import {
    createSearchableSelect,
    SearchableSelectInstance,
    SearchableSelectItem
} from "./searchable-select";

import {
    getProductionStructuresByFactoryId
} from "../database/production_queries";

let structureFactoryId: number | null = null;

let structureMachineSelect: SearchableSelectInstance | null = null;

let structureRecipeSelect: SearchableSelectInstance | null = null;

let editingStructureId: number | null = null;

let pendingDeleteStructureId: number | null = null;

let modalOptions: ProductionStructureModalOptions | null = null;

interface StructureResourceRow {
    element: HTMLElement;
    select: SearchableSelectInstance;
    amountInput: HTMLInputElement;
}

const structureInputRows: StructureResourceRow[] = [];

const structureOutputRows: StructureResourceRow[] = [];


export interface ProductionStructureModalOptions {
    getCurrentFactoryId: () => number | null;
    reloadFactory: () => Promise<void>;
}

export function configureProductionStructureModal(
    options: ProductionStructureModalOptions
): void {
    modalOptions = options;
}

export function createStructureModal(): void {
    if (
        document.getElementById(
            "structure-modal"
        )
    ) {
        return;
    }

    const modal =
        document.createElement("div");

    modal.id = "structure-modal";

    modal.className =
        "modal-overlay";

    modal.innerHTML = `
        <div class="modal structure-modal">
            <div class="modal-header">
                <h2 id="structure-modal-title">
                    Nueva estructura
                </h2>

                <button
                    type="button"
                    class="modal-close-button"
                    id="structure-modal-close"
                >
                    ×
                </button>
            </div>

            <div class="modal-body">

                <div class="form-group">
                    <label for="structure-reference">
                        Nº referencia
                    </label>

                    <input
                        id="structure-reference"
                        type="number"
                        min="1"
                        step="1"
                        value="1"
                    >
                </div>

                <div class="form-group">
                    <label>
                        Maquinaria
                    </label>

                    <div
                        id="structure-machine-select"
                    ></div>
                </div>

                <div class="form-group">
                    <label for="structure-machine-count">
                        Cantidad
                    </label>

                    <input
                        id="structure-machine-count"
                        type="number"
                        min="0"
                        step="0.01"
                        value="1"
                    >
                </div>

                <div class="form-group">
                    <label>
                        Receta
                    </label>

                    <div
                        id="structure-recipe-select"
                    ></div>
                </div>

                <div class="form-group">
                    <label for="structure-production-percentage">
                        Producción
                    </label>

                    <div class="input-with-suffix">
                        <input
                            id="structure-production-percentage"
                            type="number"
                            min="0"
                            step="1"
                            value="100"
                        >

                        <span>%</span>
                    </div>
                </div>

                <div class="form-group">
                    <label for="structure-power-shards">
                        Esquirlas
                    </label>

                    <input
                        id="structure-power-shards"
                        type="number"
                        min="0"
                        step="1"
                        value="0"
                    >
                </div>

                <section class="structure-resources-section">

                    <div class="structure-section-header">
                        <h3>Entradas</h3>
                    </div>

                    <div
                        id="structure-inputs"
                        class="structure-resource-rows"
                    ></div>

                    <button
                        type="button"
                        class="secondary-button"
                        id="add-structure-input"
                    >
                        ＋ Añadir entrada
                    </button>

                </section>

                <section class="structure-resources-section">

                    <div class="structure-section-header">
                        <h3>Salidas</h3>
                    </div>

                    <div
                        id="structure-outputs"
                        class="structure-resource-rows"
                    ></div>

                    <button
                        type="button"
                        class="secondary-button"
                        id="add-structure-output"
                    >
                        ＋ Añadir salida
                    </button>

                </section>

                <div
                    id="structure-modal-error"
                    class="form-error"
                ></div>

            </div>

            <div class="modal-footer">

                <button
                    type="button"
                    class="secondary-button"
                    id="structure-modal-cancel"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    class="primary-button"
                    id="structure-modal-save"
                >
                    Crear estructura
                </button>

            </div>
        </div>
    `;

    document.body.append(modal);

    setupStructureModalEvents();
}

function createDeleteStructureModal(): void {
    if (
        document.getElementById(
            "delete-structure-modal"
        )
    ) {
        return;
    }

    const modal =
        document.createElement("div");

    modal.id = "delete-structure-modal";
    modal.className = "modal-overlay";

    modal.innerHTML = `
        <div class="modal delete-confirmation-modal">
            <div class="modal-header">
                <h2>Eliminar estructura</h2>

                <button
                    type="button"
                    class="modal-close-button"
                    id="delete-structure-modal-close"
                >
                    ×
                </button>
            </div>

            <div class="modal-body">
                <p id="delete-structure-message">
                    ¿Quieres eliminar esta estructura?
                </p>

                <p class="delete-warning">
                    También se eliminarán sus recursos
                    de entrada y salida.
                </p>
            </div>

            <div class="modal-footer">
                <button
                    type="button"
                    class="dialog-button secondary"
                    id="delete-structure-cancel"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    class="dialog-button danger"
                    id="delete-structure-confirm"
                >
                    Eliminar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById(
            "delete-structure-modal-close"
        )
        ?.addEventListener(
            "click",
            closeDeleteStructureModal
        );

    document
        .getElementById(
            "delete-structure-cancel"
        )
        ?.addEventListener(
            "click",
            closeDeleteStructureModal
        );

    document
        .getElementById(
            "delete-structure-confirm"
        )
        ?.addEventListener(
            "click",
            () => {
                void confirmDeleteStructure();
            }
        );
}

export async function openDeleteStructureModal(
    structureId: number
): Promise<void> {
    const factoryId =
        modalOptions?.getCurrentFactoryId();

    if (factoryId === null || factoryId === undefined) {
        console.error(
            "No hay ninguna fábrica seleccionada."
        );
        return;
    }

    const structures =
        await getProductionStructuresByFactoryId(
            factoryId
        );

    const item = structures.find(
        (current) =>
            current.structure.id === structureId
    );

    if (!item) {
        console.error(
            `No se encontró la estructura ${structureId}.`
        );
        return;
    }

    createDeleteStructureModal();

    pendingDeleteStructureId = structureId;

    const message =
        document.getElementById(
            "delete-structure-message"
        );

    if (message) {
        message.textContent =
            `¿Quieres eliminar la estructura Ref. ${item.structure.reference_number}?`;
    }

    const modal =
        document.getElementById(
            "delete-structure-modal"
        );

    modal?.classList.add(
        "modal-visible"
    );
}

async function confirmDeleteStructure(): Promise<void> {
    if (pendingDeleteStructureId === null) {
        return;
    }

    const structureId =
        pendingDeleteStructureId;

    try {
        await deleteProductionStructure(
            structureId
        );

        closeDeleteStructureModal();

        if (modalOptions) {
            await modalOptions.reloadFactory();
        }

        console.log(
            `Estructura ${structureId} eliminada correctamente.`
        );
    } catch (error) {
        console.error(
            "Error eliminando la estructura:",
            error
        );

        window.alert(
            "No se ha podido eliminar la estructura."
        );
    }
}

function closeDeleteStructureModal(): void {
    const modal =
        document.getElementById(
            "delete-structure-modal"
        );

    modal?.classList.remove(
        "modal-visible"
    );

    pendingDeleteStructureId = null;
}

function setStructureModalMode(
    mode: "create" | "edit"
): void {
    const title =
        document.querySelector<HTMLElement>(
            "#structure-modal-title"
        );

    const saveButton =
        document.querySelector<HTMLButtonElement>(
            "#structure-modal-save"
        );

    if (mode === "create") {
        if (title) {
            title.textContent = "Nueva estructura";
        }

        if (saveButton) {
            saveButton.textContent =
                "Crear estructura";
        }

        return;
    }

    if (title) {
        title.textContent =
            "Editar estructura";
    }

    if (saveButton) {
        saveButton.textContent =
            "Guardar cambios";
    }
}

function setupStructureModalEvents(): void {
    const closeButton =
        document.getElementById(
            "structure-modal-close"
        );

    const cancelButton =
        document.getElementById(
            "structure-modal-cancel"
        );

    const saveButton =
        document.getElementById(
            "structure-modal-save"
        );

    const addInputButton =
        document.getElementById(
            "add-structure-input"
        );

    const addOutputButton =
        document.getElementById(
            "add-structure-output"
        );

    closeButton?.addEventListener(
        "click",
        closeStructureModal
    );

    cancelButton?.addEventListener(
        "click",
        closeStructureModal
    );

    saveButton?.addEventListener(
        "click",
        () => {
            void saveNewStructure();
        }
    );

    addInputButton?.addEventListener(
        "click",
        () => {
            addStructureResourceRow("input");
        }
    );

    addOutputButton?.addEventListener(
        "click",
        () => {
            addStructureResourceRow("output");
        }
    );
}

export async function openStructureModal(
    factoryId: number
): Promise<void> {

    editingStructureId = null;
    setStructureModalMode("create");
    
    structureFactoryId =
        factoryId;

    createStructureModal();

    resetStructureModal();

    const modal =
        document.getElementById(
            "structure-modal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add(
        "modal-visible"
    );

    const [
        resources,
        machines,
        recipes
    ] = await Promise.all([
        getResources(),
        getMachines(),
        getRecipes()
    ]);

    const machineItems:
        SearchableSelectItem[] =
        machines.map(
            (machine: Machine) => ({
                id: machine.id,
                name: machine.name
            })
        );

    const recipeItems:
        SearchableSelectItem[] =
        recipes.map(
            (recipe: Recipe) => ({
                id: recipe.id,
                name: recipe.name
            })
        );

    const resourceItems:
        SearchableSelectItem[] =
        resources.map(
            (resource: Resource) => ({
                id: resource.id,
                name: resource.name
            })
        );

    const machineContainer =
        document.getElementById(
            "structure-machine-select"
        );

    const recipeContainer =
        document.getElementById(
            "structure-recipe-select"
        );

    if (
        !machineContainer ||
        !recipeContainer
    ) {
        return;
    }

    structureMachineSelect =
        createSearchableSelect({
            items: machineItems,
            placeholder:
                "Buscar maquinaria..."
        });

    structureRecipeSelect =
        createSearchableSelect({
            items: recipeItems,
            placeholder:
                "Buscar receta..."
        });

    machineContainer.replaceChildren(
        structureMachineSelect.element
    );

    recipeContainer.replaceChildren(
        structureRecipeSelect.element
    );

    modal.dataset.resources =
        JSON.stringify(
            resourceItems
        );
}

export async function openEditStructureModal(
    structureId: number
): Promise<void> {
    const factoryId =
        modalOptions?.getCurrentFactoryId();

    if (factoryId === null || factoryId === undefined) {
        return;
    }

    createStructureModal();

    const modal =
        document.querySelector<HTMLElement>(
            "#structure-modal"
        );

    if (!modal) {
        return;
    }

    const structures =
        await getProductionStructuresByFactoryId(
            factoryId
        );

    const item = structures.find(
        (current) =>
            current.structure.id === structureId
    );

    if (!item) {
        console.error(
            `No se encontró la estructura ${structureId}.`
        );

        return;
    }
    resetStructureModal();

    editingStructureId = structureId;
    structureFactoryId = factoryId;

    setStructureModalMode("edit");

    modal.classList.add("modal-visible");

    const structure =
        item.structure;

    const referenceInput =
        document.querySelector<HTMLInputElement>(
            "#structure-reference"
        );

    const machineCountInput =
        document.querySelector<HTMLInputElement>(
            "#structure-machine-count"
        );

    const productionPercentageInput =
        document.querySelector<HTMLInputElement>(
            "#structure-production-percentage"
        );

    const powerShardsInput =
        document.querySelector<HTMLInputElement>(
            "#structure-power-shards"
        );

    if (referenceInput) {
        referenceInput.value =
            String(structure.reference_number);
    }

    if (machineCountInput) {
        machineCountInput.value =
            String(structure.machine_count);
    }

    if (productionPercentageInput) {
        productionPercentageInput.value =
            String(
                structure.production_percentage
            );
    }

    if (powerShardsInput) {
        powerShardsInput.value =
            String(structure.power_shards);
    }

    const [
        resources,
        machines,
        recipes
    ] = await Promise.all([
        getResources(),
        getMachines(),
        getRecipes()
    ]);

    const resourceItems:
        SearchableSelectItem[] =
        resources.map((resource) => ({
            id: resource.id,
            name: resource.name
        }));

    const machineItems:
        SearchableSelectItem[] =
        machines.map((machine) => ({
            id: machine.id,
            name: machine.name
        }));

    const recipeItems:
        SearchableSelectItem[] =
        recipes.map((recipe) => ({
            id: recipe.id,
            name: recipe.name
        }));

    const machineContainer =
        document.querySelector<HTMLElement>(
            "#structure-machine-select"
        );

    const recipeContainer =
        document.querySelector<HTMLElement>(
            "#structure-recipe-select"
        );

    if (!machineContainer || !recipeContainer) {
        return;
    }

    structureMachineSelect =
        createSearchableSelect({
            items: machineItems,
            placeholder: "Seleccionar maquinaria..."
        });

    structureRecipeSelect =
        createSearchableSelect({
            items: recipeItems,
            placeholder: "Seleccionar receta..."
        });

    machineContainer.replaceChildren(
        structureMachineSelect.element
    );

    recipeContainer.replaceChildren(
        structureRecipeSelect.element
    );

    structureMachineSelect.setValue(
        structure.machine_id
    );

    structureRecipeSelect.setValue(
        structure.recipe_id
    );

    modal.dataset.resources =
        JSON.stringify(resourceItems);

    for (const input of item.inputs) {
        addStructureResourceRow(
            "input",
            input.resource_id,
            input.amount_per_machine
        );
    }

    for (const output of item.outputs) {
        addStructureResourceRow(
            "output",
            output.resource_id,
            output.amount_per_machine
        );
    }
}

function resetStructureModal(): void {
    structureMachineSelect?.destroy();
    structureRecipeSelect?.destroy();

    structureMachineSelect = null;
    structureRecipeSelect = null;

    structureInputRows.length = 0;
    structureOutputRows.length = 0;

    const inputsContainer =
        document.getElementById(
            "structure-inputs"
        );

    const outputsContainer =
        document.getElementById(
            "structure-outputs"
        );

    inputsContainer?.replaceChildren();
    outputsContainer?.replaceChildren();

    const referenceInput =
        document.getElementById(
            "structure-reference"
        ) as HTMLInputElement | null;

    const machineCountInput =
        document.getElementById(
            "structure-machine-count"
        ) as HTMLInputElement | null;

    const percentageInput =
        document.getElementById(
            "structure-production-percentage"
        ) as HTMLInputElement | null;

    const shardsInput =
        document.getElementById(
            "structure-power-shards"
        ) as HTMLInputElement | null;

    const error =
        document.getElementById(
            "structure-modal-error"
        );

    if (referenceInput) {
        referenceInput.value = "1";
    }

    if (machineCountInput) {
        machineCountInput.value = "1";
    }

    if (percentageInput) {
        percentageInput.value = "100";
    }

    if (shardsInput) {
        shardsInput.value = "0";
    }

    if (error) {
        error.textContent = "";
    }

    editingStructureId = null;
    setStructureModalMode("create");

}

function addStructureResourceRow(
    type: "input" | "output",
    resourceId: number | null = null,
    amount: number | null = null
): void {
    const modal =
        document.getElementById(
            "structure-modal"
        );

    if (!modal) {
        return;
    }

    const resourcesJson =
        modal.dataset.resources;

    if (!resourcesJson) {
        return;
    }

    const resources =
        JSON.parse(
            resourcesJson
        ) as SearchableSelectItem[];

    const row =
        document.createElement("div");

    row.className =
        "structure-resource-row";

    const selectContainer =
        document.createElement("div");

    selectContainer.className =
        "structure-resource-select";

    const amountInput =
        document.createElement("input");

    amountInput.type = "number";
    amountInput.min = "0";
    amountInput.step = "0.01";
    amountInput.value =
        amount !== null
            ? String(amount)
            : "";

    amountInput.className =
        "structure-resource-amount";

    amountInput.placeholder =
        "Cantidad por máquina";

    const removeButton =
        document.createElement("button");

    removeButton.type = "button";

    removeButton.className =
        "structure-resource-remove";

    removeButton.textContent =
        "×";

    const select =
        createSearchableSelect({
            items: resources,
            placeholder:
                "Buscar recurso..."
        });
    
    if (resourceId !== null) {
        select.setValue(resourceId);
    }

    selectContainer.append(
        select.element
    );

    row.append(
        selectContainer,
        amountInput,
        removeButton
    );

    const container =
        type === "input"
            ? document.getElementById(
                "structure-inputs"
            )
            : document.getElementById(
                "structure-outputs"
            );

    if (!container) {
        select.destroy();
        return;
    }

    container.append(row);

    const rowData: StructureResourceRow = {
        element: row,
        select,
        amountInput
    };

    if (type === "input") {
        structureInputRows.push(
            rowData
        );
    } else {
        structureOutputRows.push(
            rowData
        );
    }

    removeButton.addEventListener(
        "click",
        () => {
            select.destroy();

            row.remove();

            const rows =
                type === "input"
                    ? structureInputRows
                    : structureOutputRows;

            const index =
                rows.indexOf(rowData);

            if (index !== -1) {
                rows.splice(index, 1);
            }
        }
    );
}

async function saveNewStructure(): Promise<void> {
    const errorElement =
        document.getElementById(
            "structure-modal-error"
        );

    if (errorElement) {
        errorElement.textContent = "";
    }

    if (structureFactoryId === null) {
        showStructureError(
            "No se ha seleccionado ninguna fábrica."
        );

        return;
    }

    const referenceInput =
        document.getElementById(
            "structure-reference"
        ) as HTMLInputElement | null;

    const machineCountInput =
        document.getElementById(
            "structure-machine-count"
        ) as HTMLInputElement | null;

    const percentageInput =
        document.getElementById(
            "structure-production-percentage"
        ) as HTMLInputElement | null;

    const shardsInput =
        document.getElementById(
            "structure-power-shards"
        ) as HTMLInputElement | null;

    const referenceNumber =
        Number(
            referenceInput?.value
        );

    const machineCount =
        Number(
            machineCountInput?.value
        );

    const productionPercentage =
        Number(
            percentageInput?.value
        );

    const powerShards =
        Number(
            shardsInput?.value
        );

    const machine =
        structureMachineSelect?.getValue();

    const recipe =
        structureRecipeSelect?.getValue();

    /*
     * ----------------------------------------
     * VALIDACIONES GENERALES
     * ----------------------------------------
     */

    if (!machine) {
        showStructureError(
            "Debes seleccionar una maquinaria."
        );

        return;
    }

    if (
        !Number.isFinite(referenceNumber) ||
        referenceNumber <= 0
    ) {
        showStructureError(
            "El número de referencia debe ser mayor que 0."
        );

        return;
    }

    if (
        !Number.isFinite(machineCount) ||
        machineCount <= 0
    ) {
        showStructureError(
            "La cantidad de maquinaria debe ser mayor que 0."
        );

        return;
    }

    if (
        !Number.isFinite(productionPercentage) ||
        productionPercentage <= 0
    ) {
        showStructureError(
            "La producción debe ser mayor que 0%."
        );

        return;
    }

    if (
        !Number.isFinite(powerShards) ||
        powerShards < 0
    ) {
        showStructureError(
            "La cantidad de esquirlas no puede ser negativa."
        );

        return;
    }

    /*
     * ----------------------------------------
     * VALIDAR ENTRADAS
     * ----------------------------------------
     */

    for (
        const row of structureInputRows
    ) {
        const resource =
            row.select.getValue();

        const amount =
            Number(
                row.amountInput.value
            );

        if (!resource) {
            showStructureError(
                "Todas las entradas deben tener un recurso seleccionado."
            );

            return;
        }

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            showStructureError(
                "La cantidad de cada entrada debe ser mayor que 0."
            );

            return;
        }
    }

    /*
     * ----------------------------------------
     * VALIDAR SALIDAS
     * ----------------------------------------
     */

    if (
        structureOutputRows.length === 0
    ) {
        showStructureError(
            "Debes añadir al menos una salida."
        );

        return;
    }

    for (
        const row of structureOutputRows
    ) {
        const resource =
            row.select.getValue();

        const amount =
            Number(
                row.amountInput.value
            );

        if (!resource) {
            showStructureError(
                "Todas las salidas deben tener un recurso seleccionado."
            );

            return;
        }

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            showStructureError(
                "La cantidad de cada salida debe ser mayor que 0."
            );

            return;
        }
    }

    /*
     * ----------------------------------------
     * GUARDAR EN SQLITE
     * ----------------------------------------
     */

    try {
        const inputs =
            structureInputRows.map((row) => {
                const resource =
                    row.select.getValue();

                if (!resource) {
                    throw new Error(
                        "Todas las entradas deben tener un recurso seleccionado."
                    );
                }

                return {
                    resourceId: resource.id,
                    amountPerMachine:
                        Number(
                            row.amountInput.value
                        )
                };
            });

        const outputs =
            structureOutputRows.map((row) => {
                const resource =
                    row.select.getValue();

                if (!resource) {
                    throw new Error(
                        "Todas las salidas deben tener un recurso seleccionado."
                    );
                }

                return {
                    resourceId: resource.id,
                    amountPerMachine:
                        Number(
                            row.amountInput.value
                        )
                };
            });

        if (editingStructureId !== null) {
            await updateProductionStructure({
                id: editingStructureId,
                referenceNumber,
                machineId: machine.id,
                machineCount,
                recipeId: recipe?.id ?? null,
                productionPercentage,
                powerShards,
                inputs,
                outputs
            });

            console.log(
                "Estructura actualizada correctamente:",
                editingStructureId
            );
        } else {
            const productionLineId =
                await createProductionStructure({
                    factoryId: structureFactoryId,
                    referenceNumber,
                    machineId: machine.id,
                    machineCount,
                    recipeId: recipe?.id ?? null,
                    productionPercentage,
                    powerShards,
                    inputs,
                    outputs
                });

            console.log(
                "Estructura creada correctamente:",
                productionLineId
            );
        }

        closeStructureModal();

        /*
         * Volver a cargar la fábrica.
         */

        if (modalOptions) {
            await modalOptions.reloadFactory();
        }

    } catch (error) {
        console.error(
            "Error creando estructura:",
            error
        );

        showStructureError(
            error instanceof Error
                ? error.message
                : "No se pudo crear la estructura."
        );
    }
}

function showStructureError(
    message: string
): void {
    const errorElement =
        document.getElementById(
            "structure-modal-error"
        );

    if (!errorElement) {
        return;
    }

    errorElement.textContent =
        message;
}

function closeStructureModal(): void {
    const modal =
        document.getElementById(
            "structure-modal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "modal-visible"
    );

    structureMachineSelect?.destroy();
    structureRecipeSelect?.destroy();

    structureMachineSelect = null;
    structureRecipeSelect = null;

    structureInputRows.length = 0;
    structureOutputRows.length = 0;

    structureFactoryId = null;
    editingStructureId = null;
}