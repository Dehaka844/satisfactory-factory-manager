import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
    if (db) {
        return db;
    }

    db = await Database.load(
        "sqlite:factory_manager.db"
    );

    console.log(
        "Base de datos SQLite conectada"
    );

    return db;
}


export async function createDatabaseBackup(
    backupPath: string
): Promise<void> {
    const database =
        await getDatabase();

    const escapedPath =
        backupPath.replace(/'/g, "''");

    await database.execute(
        `VACUUM INTO '${escapedPath}'`
    );

    console.log(
        "Backup de la base de datos creado:",
        backupPath
    );
}