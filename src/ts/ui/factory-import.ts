import {
    importFactoryFromJson,
    createFactoryFromImport,
    getFactoryByName
} from "../database/factory_import";


export interface FactoryImportUIOptions {
    reloadFactories: () => Promise<void>;
}


let reloadFactories:
    (() => Promise<void>) | null = null;


export function configureFactoryImportUI(
    options: FactoryImportUIOptions
): void {

    reloadFactories =
        options.reloadFactories;
}


export async function handleFactoryImport(): Promise<void> {

    try {

        const data =
            await importFactoryFromJson();

        if (!data) {
            return;
        }

        let factoryName =
            data.factory.name;

        const existingFactoryId =
            await getFactoryByName(
                factoryName
            );

        if (existingFactoryId !== null) {

            const newName =
                await askImportedFactoryName(
                    factoryName
                );

            if (!newName) {
                return;
            }

            factoryName =
                newName;
        }

        const factoryId =
            await createFactoryFromImport(
                data,
                factoryName
            );

        console.log(
            "Fábrica importada correctamente:",
            factoryId,
            factoryName
        );

        if (reloadFactories) {
            await reloadFactories();
        }

    } catch (error) {

        console.error(
            "Error importando fábrica:",
            error
        );
    }
}


function askImportedFactoryName(
    originalName: string
): Promise<string | null> {

    return new Promise((resolve) => {

        const overlay =
            document.createElement("div");

        overlay.className =
            "modal-overlay modal-visible";

        overlay.innerHTML = `
            <div class="import-conflict-modal">
                <div class="modal-header">
                    <h2>La fábrica ya existe</h2>
                </div>

                <div class="modal-body">
                    <p>
                        Ya existe una fábrica llamada
                        <strong>${originalName}</strong>.
                    </p>

                    <p class="import-conflict-warning">
                        Puedes cancelar la importación
                        o asignarle otro nombre.
                    </p>

                    <div class="form-group">
                        <label for="import-factory-name">
                            Nuevo nombre
                        </label>

                        <input
                            id="import-factory-name"
                            type="text"
                            value="${originalName}"
                        />
                    </div>

                    <div
                        class="form-error"
                        id="import-factory-name-error"
                        hidden
                    ></div>
                </div>

                <div class="modal-footer">
                    <button
                        type="button"
                        class="secondary-button"
                        data-import-conflict-cancel
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        class="primary-button"
                        data-import-conflict-confirm
                    >
                        Importar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(
            overlay
        );


        const input =
            overlay.querySelector<HTMLInputElement>(
                "#import-factory-name"
            );

        const error =
            overlay.querySelector<HTMLElement>(
                "#import-factory-name-error"
            );

        const cancelButton =
            overlay.querySelector<HTMLButtonElement>(
                "[data-import-conflict-cancel]"
            );

        const confirmButton =
            overlay.querySelector<HTMLButtonElement>(
                "[data-import-conflict-confirm]"
            );


        const close = (
            result: string | null
        ): void => {

            overlay.remove();

            resolve(result);
        };


        cancelButton?.addEventListener(
            "click",
            () => {

                close(null);
            }
        );


        confirmButton?.addEventListener(
            "click",
            async () => {

                const newName =
                    input?.value.trim() ?? "";

                if (!newName) {

                    if (error) {

                        error.textContent =
                            "El nombre no puede estar vacío.";

                        error.hidden =
                            false;
                    }

                    return;
                }


                try {

                    const existingFactoryId =
                        await getFactoryByName(
                            newName
                        );

                    if (
                        existingFactoryId !== null
                    ) {

                        if (error) {

                            error.textContent =
                                "Ya existe una fábrica con ese nombre.";

                            error.hidden =
                                false;
                        }

                        return;
                    }


                    close(
                        newName
                    );

                } catch (error) {

                    console.error(
                        "Error comprobando el nombre de la fábrica:",
                        error
                    );
                }
            }
        );


        input?.focus();

        input?.select();
    });
}