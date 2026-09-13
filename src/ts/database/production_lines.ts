import { getDatabase } from "./database";

export interface ProductionLine {
    id: number;
    factory_id: number;
    reference_number: number;
    machine_id: number;
    machine_count: number;
    recipe_id: number | null;
    production_percentage: number;
    power_shards: number;
}

export async function getProductionLinesByFactoryId(
    factoryId: number
): Promise<ProductionLine[]> {
    const db = await getDatabase();

    return await db.select<ProductionLine[]>(
        `
        SELECT
            id,
            factory_id,
            reference_number,
            machine_id,
            machine_count,
            recipe_id,
            production_percentage,
            power_shards
        FROM production_lines
        WHERE factory_id = ?
        ORDER BY reference_number ASC, id ASC
        `,
        [factoryId]
    );
}

export async function getProductionLineById(
    id: number
): Promise<ProductionLine | null> {
    const db = await getDatabase();

    const lines = await db.select<ProductionLine[]>(
        `
        SELECT
            id,
            factory_id,
            reference_number,
            machine_id,
            machine_count,
            recipe_id,
            production_percentage,
            power_shards
        FROM production_lines
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return lines[0] ?? null;
}

export async function createProductionLine(
    factoryId: number,
    referenceNumber: number,
    machineId: number,
    machineCount: number = 1,
    recipeId: number | null = null,
    productionPercentage: number = 100,
    powerShards: number = 0
): Promise<number> {
    const db = await getDatabase();

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
            factoryId,
            referenceNumber,
            machineId,
            machineCount,
            recipeId,
            productionPercentage,
            powerShards
        ]
    );

    return result.lastInsertId ?? 0;
}

export async function updateProductionLine(
    id: number,
    referenceNumber: number,
    machineId: number,
    machineCount: number,
    recipeId: number | null,
    productionPercentage: number,
    powerShards: number
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
            referenceNumber,
            machineId,
            machineCount,
            recipeId,
            productionPercentage,
            powerShards,
            id
        ]
    );
}

export async function deleteProductionLine(
    id: number
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        DELETE FROM production_lines
        WHERE id = ?
        `,
        [id]
    );
}