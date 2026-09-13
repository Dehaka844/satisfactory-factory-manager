import { getDatabase } from "./database";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

import {
    createDatabaseBackup
} from "./database";

export interface FactoryExportResource {
    name: string;
    storage_per_minute: number;
}

export interface FactoryExportSection {
    type: string;
    title: string;
    content: string;
    position: number;
}

export interface FactoryExportInput {
    resource: string;
    amount_per_machine: number;
}

export interface FactoryExportOutput {
    resource: string;
    amount_per_machine: number;
}

export interface FactoryExportProductionLine {
    reference_number: number;

    machine: string;
    machine_count: number;

    recipe: string | null;

    production_percentage: number;
    power_shards: number;

    inputs: FactoryExportInput[];
    outputs: FactoryExportOutput[];
}

export interface FactoryExportData {
    format: "satisfactory-factory-manager";
    version: 1;
    exported_at: string;

    factory: {
        name: string;
        description: string;

        sections: FactoryExportSection[];
        resources: FactoryExportResource[];
        production_lines: FactoryExportProductionLine[];
    };
}

export async function getFactoryExportData(
    factoryId: number
): Promise<FactoryExportData> {
    const db = await getDatabase();

    const factories =
        await db.select<
            {
                id: number;
                name: string;
                description: string;
            }[]
        >(
            `
            SELECT
                id,
                name,
                description

            FROM factories

            WHERE id = ?
            `,
            [factoryId]
        );

    if (factories.length === 0) {
        throw new Error(
            `No se encontró la fábrica con ID ${factoryId}.`
        );
    }

    const factory = factories[0];

    const sections =
        await db.select<
            {
                type: string;
                title: string;
                content: string;
                position: number;
            }[]
        >(
            `
            SELECT
                type,
                title,
                content,
                position

            FROM sections

            WHERE factory_id = ?

            ORDER BY position ASC, id ASC
            `,
            [factoryId]
        );

    const resources =
        await db.select<
            {
                resource_name: string;
                storage_per_minute: number;
            }[]
        >(
            `
            SELECT
                r.name AS resource_name,
                fr.storage_per_minute

            FROM factory_resources fr

            INNER JOIN resources r
                ON r.id = fr.resource_id

            WHERE fr.factory_id = ?

            ORDER BY r.name ASC
            `,
            [factoryId]
        );

    const productionLines =
        await db.select<
            {
                id: number;
                reference_number: number;

                machine_name: string;
                machine_count: number;

                recipe_name: string | null;

                production_percentage: number;
                power_shards: number;
            }[]
        >(
            `
            SELECT
                pl.id,
                pl.reference_number,

                m.name AS machine_name,
                pl.machine_count,

                r.name AS recipe_name,

                pl.production_percentage,
                pl.power_shards

            FROM production_lines pl

            INNER JOIN machines m
                ON m.id = pl.machine_id

            LEFT JOIN recipes r
                ON r.id = pl.recipe_id

            WHERE pl.factory_id = ?

            ORDER BY
                pl.reference_number ASC,
                pl.id ASC
            `,
            [factoryId]
        );

    const productionLinesExport:
        FactoryExportProductionLine[] = [];

    for (const productionLine of productionLines) {
        const inputs =
            await db.select<
                {
                    resource_name: string;
                    amount_per_machine: number;
                }[]
            >(
                `
                SELECT
                    r.name AS resource_name,
                    pi.amount_per_machine

                FROM production_inputs pi

                INNER JOIN resources r
                    ON r.id = pi.resource_id

                WHERE pi.production_line_id = ?

                ORDER BY pi.id ASC
                `,
                [productionLine.id]
            );

        const outputs =
            await db.select<
                {
                    resource_name: string;
                    amount_per_machine: number;
                }[]
            >(
                `
                SELECT
                    r.name AS resource_name,
                    po.amount_per_machine

                FROM production_outputs po

                INNER JOIN resources r
                    ON r.id = po.resource_id

                WHERE po.production_line_id = ?

                ORDER BY po.id ASC
                `,
                [productionLine.id]
            );

        productionLinesExport.push({
            reference_number:
                productionLine.reference_number,

            machine:
                productionLine.machine_name,

            machine_count:
                productionLine.machine_count,

            recipe:
                productionLine.recipe_name,

            production_percentage:
                productionLine.production_percentage,

            power_shards:
                productionLine.power_shards,

            inputs: inputs.map((input) => ({
                resource:
                    input.resource_name,

                amount_per_machine:
                    input.amount_per_machine
            })),

            outputs: outputs.map((output) => ({
                resource:
                    output.resource_name,

                amount_per_machine:
                    output.amount_per_machine
            }))
        });
    }

    return {
        format: "satisfactory-factory-manager",

        version: 1,

        exported_at:
            new Date().toISOString(),

        factory: {
            name: factory.name,
            description: factory.description,

            sections: sections.map((section) => ({
                type: section.type,
                title: section.title,
                content: section.content,
                position: section.position
            })),

            resources: resources.map((resource) => ({
                name: resource.resource_name,
                storage_per_minute:
                    resource.storage_per_minute
            })),

            production_lines:
                productionLinesExport
        }
    };
}

export async function exportFactoryToJson(
    factoryId: number
): Promise<void> {
    const data =
        await getFactoryExportData(factoryId);

    const json = JSON.stringify(
        data,
        null,
        4
    );

    const safeFileName =
        data.factory.name
            .trim()
            .replace(/[<>:"/\\|?*]/g, "_")
            .replace(/\s+/g, "_");

    const fileName =
        `${safeFileName || "fabrica"}.json`;

    const filePath =
        await save({
            title: "Exportar fábrica",
            defaultPath: fileName,
            filters: [
                {
                    name: "Archivo JSON",
                    extensions: ["json"]
                }
            ]
        });

    if (!filePath) {
        return;
    }

    await writeTextFile(
        filePath,
        json
    );
}

export async function exportDatabaseBackup(): Promise<void> {
    const filePath =
        await save({
            title: "Guardar backup de la base de datos",
            defaultPath:
                "factory_manager_backup.db",
            filters: [
                {
                    name: "Base de datos SQLite",
                    extensions: ["db"]
                }
            ]
        });

    if (!filePath) {
        return;
    }

    await createDatabaseBackup(
        filePath
    );
}