import { getDatabase } from "./database";

export interface ProductionInput {
    id: number;
    production_line_id: number;
    resource_id: number;
    amount_per_machine: number;
}

export async function getProductionInputsByLineId(
    productionLineId: number
): Promise<ProductionInput[]> {
    const db = await getDatabase();

    return await db.select<ProductionInput[]>(
        `
        SELECT
            id,
            production_line_id,
            resource_id,
            amount_per_machine
        FROM production_inputs
        WHERE production_line_id = ?
        ORDER BY id ASC
        `,
        [productionLineId]
    );
}

export async function getProductionInputById(
    id: number
): Promise<ProductionInput | null> {
    const db = await getDatabase();

    const inputs = await db.select<ProductionInput[]>(
        `
        SELECT
            id,
            production_line_id,
            resource_id,
            amount_per_machine
        FROM production_inputs
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return inputs[0] ?? null;
}

export async function createProductionInput(
    productionLineId: number,
    resourceId: number,
    amountPerMachine: number
): Promise<number> {
    const db = await getDatabase();

    const result = await db.execute(
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
            amountPerMachine
        ]
    );

    return result.lastInsertId ?? 0;
}

export async function updateProductionInput(
    id: number,
    resourceId: number,
    amountPerMachine: number
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        UPDATE production_inputs
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

export async function deleteProductionInput(
    id: number
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        DELETE FROM production_inputs
        WHERE id = ?
        `,
        [id]
    );
}