import { getDatabase } from "./database";

export interface Recipe {
    id: number;
    name: string;
}

export async function getRecipes(): Promise<Recipe[]> {
    const db = await getDatabase();

    return await db.select<Recipe[]>(
        `
        SELECT
            id,
            name
        FROM recipes
        ORDER BY name ASC
        `
    );
}

export async function getRecipeById(
    id: number
): Promise<Recipe | null> {
    const db = await getDatabase();

    const recipes = await db.select<Recipe[]>(
        `
        SELECT
            id,
            name
        FROM recipes
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return recipes[0] ?? null;
}

export async function createRecipe(
    name: string
): Promise<number> {
    const db = await getDatabase();

    const result = await db.execute(
        `
        INSERT INTO recipes (name)
        VALUES (?)
        `,
        [name]
    );

    return result.lastInsertId ?? 0;
}

export async function updateRecipe(
    id: number,
    name: string
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        UPDATE recipes
        SET name = ?
        WHERE id = ?
        `,
        [name, id]
    );
}

export async function deleteRecipe(
    id: number
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        DELETE FROM recipes
        WHERE id = ?
        `,
        [id]
    );
}