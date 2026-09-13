import { getDatabase } from "./database";

export interface Machine {
    id: number;
    name: string;
}

export async function getMachines(): Promise<Machine[]> {
    const db = await getDatabase();

    return await db.select<Machine[]>(
        `
        SELECT
            id,
            name
        FROM machines
        ORDER BY name ASC
        `
    );
}

export async function getMachineById(
    id: number
): Promise<Machine | null> {
    const db = await getDatabase();

    const machines = await db.select<Machine[]>(
        `
        SELECT
            id,
            name
        FROM machines
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return machines[0] ?? null;
}

export async function createMachine(
    name: string
): Promise<number> {
    const db = await getDatabase();

    const result = await db.execute(
        `
        INSERT INTO machines (name)
        VALUES (?)
        `,
        [name]
    );

    return result.lastInsertId ?? 0;
}

export async function updateMachine(
    id: number,
    name: string
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        UPDATE machines
        SET name = ?
        WHERE id = ?
        `,
        [name, id]
    );
}

export async function deleteMachine(
    id: number
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        DELETE FROM machines
        WHERE id = ?
        `,
        [id]
    );
}