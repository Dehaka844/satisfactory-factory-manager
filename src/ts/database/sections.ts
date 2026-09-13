import { getDatabase } from "./database";

export interface Section {
    id: number;
    factory_id: number;
    type: string;
    title: string;
    content: string;
    position: number;
}

export async function getSectionsByFactoryId(
    factoryId: number
): Promise<Section[]> {
    const db = await getDatabase();

    return await db.select<Section[]>(
        `
        SELECT
            id,
            factory_id,
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
}

export async function createSection(
    factoryId: number,
    title: string,
    type: string = "text"
): Promise<number> {
    const db = await getDatabase();

    const result = await db.execute(
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
            type,
            title,
            "",
            0
        ]
    );

    return result.lastInsertId ?? 0;
}

export async function updateSectionContent(
    id: number,
    content: string
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        UPDATE sections
        SET content = ?
        WHERE id = ?
        `,
        [content, id]
    );
}

export async function deleteSection(id: number): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        DELETE FROM sections
        WHERE id = ?
        `,
        [id]
    );
}