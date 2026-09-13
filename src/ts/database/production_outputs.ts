import { getDatabase } from "./database";

export interface ProductionOutput {
    id: number;
    production_line_id: number;
    resource_id: number;
    amount_per_machine: number;
}

export async function getProductionOutputsByLineId(
    productionLineId: number
): Promise<ProductionOutput[]> {
    const db = await getDatabase();

    return await db.select<ProductionOutput[]>(
        `
        SELECT
            id,
            production_line_id,
            resource_id,
            amount_per_machine
        FROM production_outputs
        WHERE production_line_id = ?
        ORDER BY id ASC
        `,
        [productionLineId]
    );
}

export async function getProductionOutputById(
    id: number
): Promise<ProductionOutput | null> {
    const db = await getDatabase();

    const outputs = await db.select<ProductionOutput[]>(
        `
        SELECT
            id,
            production_line_id,
            resource_id,
            amount_per_machine
        FROM production_outputs
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return outputs[0] ?? null;
}

export async function createProductionOutput(
    productionLineId: number,
    resourceId: number,
    amountPerMachine: number
): Promise<number> {
    const db = await getDatabase();

    const result = await db.execute(
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
            amountPerMachine
        ]
    );

    return result.lastInsertId ?? 0;
}

export async function updateProductionOutput(
    id: number,
    resourceId: number,
    amountPerMachine: number
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        UPDATE production_outputs
        SET
            resource_id = ?,
            amount_per_machine = ?
        WHERE id = ?
        `,
        [
            resourceId,
            amountPerMachine,
            id
        ]
    );
}

export async function deleteProductionOutput(
    id: number
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        DELETE FROM production_outputs
        WHERE id = ?
        `,
        [id]
    );
}