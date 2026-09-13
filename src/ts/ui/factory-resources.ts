import {
    setFactoryResourceStorage
} from "../database/production_queries";


export interface FactoryResourcesUIOptions {
    getCurrentFactoryId: () => number | null;
    reloadFactory: () => Promise<void>;
}


let getCurrentFactoryId:
    (() => number | null) | null = null;

let reloadFactory:
    (() => Promise<void>) | null = null;


export function configureFactoryResourcesUI(
    options: FactoryResourcesUIOptions
): void {

    getCurrentFactoryId =
        options.getCurrentFactoryId;

    reloadFactory =
        options.reloadFactory;


    document.addEventListener(
        "change",
        async (event) => {

            const target =
                event.target;

            if (
                !(target instanceof HTMLInputElement)
            ) {
                return;
            }

            const resourceId =
                target.dataset.resourceStorage;

            const factoryId =
                getCurrentFactoryId?.() ?? null;

            if (
                !resourceId ||
                !factoryId
            ) {
                return;
            }

            const storagePerMinute =
                Number(
                    target.value
                );

            if (
                !Number.isFinite(
                    storagePerMinute
                )
            ) {
                return;
            }

            if (
                storagePerMinute < 0
            ) {
                target.value = "0";
                return;
            }

            try {

                await setFactoryResourceStorage(
                    factoryId,
                    Number(resourceId),
                    storagePerMinute
                );

                if (reloadFactory) {
                    await reloadFactory();
                }

            } catch (error) {

                console.error(
                    "Error guardando almacenamiento del recurso:",
                    error
                );
            }
        }
    );
}