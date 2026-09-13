import { getDatabase } from "./database";

export interface Factory {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export async function getFactories(): Promise<Factory[]> {
    const db = await getDatabase();

    return await db.select<Factory[]>(
        `
        SELECT
            id,
            name,
            description,
            created_at,
            updated_at
        FROM factories
        ORDER BY id ASC
        `
    );
}

export async function getFactoryById(
    id: number
): Promise<Factory | null> {
    const db = await getDatabase();

    const factories = await db.select<Factory[]>(
        `
        SELECT
            id,
            name,
            description,
            created_at,
            updated_at
        FROM factories
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return factories[0] ?? null;
}

export async function createFactory(
    name: string,
    description: string = ""
): Promise<number> {
    const db = await getDatabase();

    const result = await db.execute(
        `
        INSERT INTO factories (name, description)
        VALUES (?, ?)
        `,
        [name, description]
    );

    return result.lastInsertId ?? 0;
}

export async function updateFactory(
    id: number,
    name: string,
    description: string
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        UPDATE factories
        SET
            name = ?,
            description = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [name, description, id]
    );
}

export async function deleteFactory(id: number): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        DELETE FROM factories
        WHERE id = ?
        `,
        [id]
    );
}