import {
    exportFactoryToJson
} from "../database/factory_export";


export interface FactoryExportUIOptions {
    getCurrentFactoryId: () => number | null;
}


let getCurrentFactoryId:
    (() => number | null) | null = null;


export function configureFactoryExportUI(
    options: FactoryExportUIOptions
): void {

    getCurrentFactoryId =
        options.getCurrentFactoryId;


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

            const exportButton =
                target.closest<HTMLElement>(
                    "[data-export-factory]"
                );

            if (!exportButton) {
                return;
            }

            const factoryId =
                exportButton.dataset.exportFactory;

            if (!factoryId) {
                return;
            }

            const currentFactoryId =
                getCurrentFactoryId?.() ?? null;

            if (
                !currentFactoryId ||
                Number(factoryId) !== currentFactoryId
            ) {
                return;
            }

            try {

                await exportFactoryToJson(
                    Number(factoryId)
                );

            } catch (error) {

                console.error(
                    "Error exportando fábrica:",
                    error
                );
            }
        }
    );
}