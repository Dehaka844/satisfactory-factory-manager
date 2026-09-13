import { getDatabase } from "./database";

export interface CreateProductionStructureData {
    factoryId: number;
    referenceNumber: number;
    machineId: number;
    machineCount: number;
    recipeId: number | null;
    productionPercentage: number;
    powerShards: number;

    inputs: {
        resourceId: number;
        amountPerMachine: number;
    }[];

    outputs: {
        resourceId: number;
        amountPerMachine: number;
    }[];
}

export interface UpdateProductionStructureData {
    id: number;
    referenceNumber: number;
    machineId: number;
    machineCount: number;
    recipeId: number | null;
    productionPercentage: number;
    powerShards: number;

    inputs: {
        resourceId: number;
        amountPerMachine: number;
    }[];

    outputs: {
        resourceId: number;
        amountPerMachine: number;
    }[];
}

export async function createProductionStructure(
    data: CreateProductionStructureData
): Promise<number> {
    const db = await getDatabase();

    let productionLineId: number | null = null;

    try {
        const result = await db.execute(
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
                data.factoryId,
                data.referenceNumber,
                data.machineId,
                data.machineCount,
                data.recipeId,
                data.productionPercentage,
                data.powerShards
            ]
        );

        productionLineId = result.lastInsertId ?? null;

        if (!productionLineId) {
            throw new Error(
                "No se pudo obtener el ID de la estructura creada."
            );
        }

        for (const input of data.inputs) {
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
                    input.resourceId,
                    input.amountPerMachine
                ]
            );
        }

        for (const output of data.outputs) {
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
                    output.resourceId,
                    output.amountPerMachine
                ]
            );
        }

        return productionLineId;
    } catch (error) {
        if (productionLineId !== null) {
            try {
                await db.execute(
                    `
                    DELETE FROM production_lines
                    WHERE id = ?
                    `,
                    [productionLineId]
                );
            } catch (cleanupError) {
                console.error(
                    "Error limpiando estructura incompleta:",
                    cleanupError
                );
            }
        }

        throw error;
    }
}

export async function updateProductionStructure(
    data: UpdateProductionStructureData
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        UPDATE production_lines
        SET
            reference_number = ?,
            machine_id = ?,
            machine_count = ?,
            recipe_id = ?,
            production_percentage = ?,
            power_shards = ?
        WHERE id = ?
        `,
        [
            data.referenceNumber,
            data.machineId,
            data.machineCount,
            data.recipeId,
            data.productionPercentage,
            data.powerShards,
            data.id
        ]
    );

    await db.execute(
        `
        DELETE FROM production_inputs
        WHERE production_line_id = ?
        `,
        [data.id]
    );

    for (const input of data.inputs) {
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
                data.id,
                input.resourceId,
                input.amountPerMachine
            ]
        );
    }

    await db.execute(
        `
        DELETE FROM production_outputs
        WHERE production_line_id = ?
        `,
        [data.id]
    );

    for (const output of data.outputs) {
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
                data.id,
                output.resourceId,
                output.amountPerMachine
            ]
        );
    }
}

export async function deleteProductionStructure(
    productionLineId: number
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        DELETE FROM production_lines
        WHERE id = ?
        `,
        [productionLineId]
    );
}