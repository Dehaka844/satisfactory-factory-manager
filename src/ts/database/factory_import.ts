import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";

import { getDatabase } from "./database";

import {
    FactoryExportData
} from "./factory_export";


export async function importFactoryFromJson(): Promise<FactoryExportData | null> {
    const filePath =
        await open({
            title: "Importar fábrica",
            multiple: false,
            directory: false,
            filters: [
                {
                    name: "Archivo JSON",
                    extensions: ["json"]
                }
            ]
        });

    if (!filePath) {
        return null;
    }

    if (Array.isArray(filePath)) {
        throw new Error(
            "Se esperaba seleccionar un único archivo."
        );
    }

    const json =
        await readTextFile(filePath);

    let data: unknown;

    try {
        data = JSON.parse(json);
    } catch {
        throw new Error(
            "El archivo seleccionado no contiene un JSON válido."
        );
    }

    if (
        typeof data !== "object" ||
        data === null
    ) {
        throw new Error(
            "El archivo no contiene una estructura válida."
        );
    }

    const exportData =
        data as Partial<FactoryExportData>;

    if (
        exportData.format !==
        "satisfactory-factory-manager"
    ) {
        throw new Error(
            "El archivo no pertenece a Satisfactory Factory Manager."
        );
    }

    if (exportData.version !== 1) {
        throw new Error(
            `Versión de archivo no compatible: ${exportData.version}.`
        );
    }

    if (
        !exportData.factory ||
        typeof exportData.factory !== "object"
    ) {
        throw new Error(
            "El archivo no contiene los datos de la fábrica."
        );
    }

    return exportData as FactoryExportData;
}


async function getResourceId(
    resourceName: string
): Promise<number> {
    const db = await getDatabase();

    await db.execute(
        `
        INSERT OR IGNORE INTO resources (
            name
        )
        VALUES (?)
        `,
        [resourceName]
    );

    const resources =
        await db.select<
            { id: number }[]
        >(
            `
            SELECT id
            FROM resources
            WHERE name = ?
            `,
            [resourceName]
        );

    if (resources.length === 0) {
        throw new Error(
            `No se pudo obtener el recurso "${resourceName}".`
        );
    }

    return resources[0].id;
}


async function getMachineId(
    machineName: string
): Promise<number> {
    const db = await getDatabase();

    await db.execute(
        `
        INSERT OR IGNORE INTO machines (
            name
        )
        VALUES (?)
        `,
        [machineName]
    );

    const machines =
        await db.select<
            { id: number }[]
        >(
            `
            SELECT id
            FROM machines
            WHERE name = ?
            `,
            [machineName]
        );

    if (machines.length === 0) {
        throw new Error(
            `No se pudo obtener la máquina "${machineName}".`
        );
    }

    return machines[0].id;
}


async function getRecipeId(
    recipeName: string
): Promise<number> {
    const db = await getDatabase();

    await db.execute(
        `
        INSERT OR IGNORE INTO recipes (
            name
        )
        VALUES (?)
        `,
        [recipeName]
    );

    const recipes =
        await db.select<
            { id: number }[]
        >(
            `
            SELECT id
            FROM recipes
            WHERE name = ?
            `,
            [recipeName]
        );

    if (recipes.length === 0) {
        throw new Error(
            `No se pudo obtener la receta "${recipeName}".`
        );
    }

    return recipes[0].id;
}


export async function getFactoryByName(
    name: string
): Promise<number | null> {
    const db = await getDatabase();

    const factories =
        await db.select<
            { id: number }[]
        >(
            `
            SELECT id
            FROM factories
            WHERE name = ?
            `,
            [name]
        );

    if (factories.length === 0) {
        return null;
    }

    return factories[0].id;
}


export async function createFactoryFromImport(
    data: FactoryExportData,
    factoryName?: string
): Promise<number> {
    const db = await getDatabase();

    const finalFactoryName =
        factoryName?.trim() ||
        data.factory.name;

    const existingFactoryId =
        await getFactoryByName(
            finalFactoryName
        );

    if (existingFactoryId !== null) {
        throw new Error(
            `Ya existe una fábrica llamada "${finalFactoryName}".`
        );
    }

    await db.execute(
        `BEGIN TRANSACTION`
    );

    try {
        const factoryResult =
            await db.execute(
                `
                INSERT INTO factories (
                    name,
                    description
                )
                VALUES (?, ?)
                `,
                [
                    finalFactoryName,
                    data.factory.description
                ]
            );

        const factoryId =
            Number(factoryResult.lastInsertId);

        /*
         * SECCIONES
         */

        for (const section of data.factory.sections) {
            await db.execute(
                `
                INSERT INTO sections (
                    factory_id,
                    type,
                    title,
                    content,
                    position
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    factoryId,
                    section.type,
                    section.title,
                    section.content,
                    section.position
                ]
            );
        }

        /*
         * RECURSOS DE LA FÁBRICA
         */

        for (const resource of data.factory.resources) {
            const resourceId =
                await getResourceId(
                    resource.name
                );

            await db.execute(
                `
                INSERT INTO factory_resources (
                    factory_id,
                    resource_id,
                    storage_per_minute
                )
                VALUES (?, ?, ?)
                `,
                [
                    factoryId,
                    resourceId,
                    resource.storage_per_minute
                ]
            );
        }

        /*
         * LÍNEAS DE PRODUCCIÓN
         */

        for (
            const productionLine
            of data.factory.production_lines
        ) {
            const machineId =
                await getMachineId(
                    productionLine.machine
                );

            let recipeId:
                number | null = null;

            if (
                productionLine.recipe !== null
            ) {
                recipeId =
                    await getRecipeId(
                        productionLine.recipe
                    );
            }

            const productionLineResult =
                await db.execute(
                    `
                    INSERT INTO production_lines (
                        factory_id,
                        reference_number,
                        machine_id,
                        machine_count,
                        recipe_id,
                        production_percentage,
                        power_shards
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        factoryId,
                        productionLine.reference_number,
                        machineId,
                        productionLine.machine_count,
                        recipeId,
                        productionLine.production_percentage,
                        productionLine.power_shards
                    ]
                );

            const productionLineId =
                Number(
                    productionLineResult.lastInsertId
                );

            /*
             * INPUTS
             */

            for (
                const input
                of productionLine.inputs
            ) {
                const resourceId =
                    await getResourceId(
                        input.resource
                    );

                await db.execute(
                    `
                    INSERT INTO production_inputs (
                        production_line_id,
                        resource_id,
                        amount_per_machine
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        productionLineId,
                        resourceId,
                        input.amount_per_machine
                    ]
                );
            }

            /*
             * OUTPUTS
             */

            for (
                const output
                of productionLine.outputs
            ) {
                const resourceId =
                    await getResourceId(
                        output.resource
                    );

                await db.execute(
                    `
                    INSERT INTO production_outputs (
                        production_line_id,
                        resource_id,
                        amount_per_machine
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        productionLineId,
                        resourceId,
                        output.amount_per_machine
                    ]
                );
            }
        }

        await db.execute(
            `COMMIT`
        );

        return factoryId;

    } catch (error) {
        try {
            await db.execute(
                `ROLLBACK`
            );
        } catch (rollbackError) {
            console.error(
                "Error haciendo rollback de la importación:",
                rollbackError
            );
        }

        throw error;
    }
}