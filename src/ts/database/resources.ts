import { getDatabase } from "./database";

export interface Resource {
    id: number;
    name: string;
}

export async function getResources(): Promise<Resource[]> {
    const db = await getDatabase();

    return await db.select<Resource[]>(
        `
        SELECT
            id,
            name
        FROM resources
        ORDER BY name ASC
        `
    );
}

export async function getResourceById(
    id: number
): Promise<Resource | null> {
    const db = await getDatabase();

    const resources = await db.select<Resource[]>(
        `
        SELECT
            id,
            name
        FROM resources
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return resources[0] ?? null;
}

export async function createResource(
    name: string
): Promise<number> {
    const db = await getDatabase();

    const result = await db.execute(
        `
        INSERT INTO resources (name)
        VALUES (?)
        `,
        [name]
    );

    return result.lastInsertId ?? 0;
}

export async function updateResource(
    id: number,
    name: string
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        UPDATE resources
        SET name = ?
        WHERE id = ?
        `,
        [name, id]
    );
}

export async function deleteResource(
    id: number
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        DELETE FROM resources
        WHERE id = ?
        `,
        [id]
    );
}