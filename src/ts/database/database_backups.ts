import { mkdir, readDir, remove } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";

import {
    createDatabaseBackup
} from "./database";

const BACKUP_INTERVAL_MS =
    30 * 60 * 1000;

const MAX_BACKUPS = 10;

let backupTimer: number | null = null;
let backupInProgress = false;


async function getBackupDirectory(): Promise<string> {
    const appData =
        await appDataDir();

    const backupDirectory =
        await join(
            appData,
            "backups"
        );

    await mkdir(
        backupDirectory,
        {
            recursive: true
        }
    );

    return backupDirectory;
}


function createBackupFileName(): string {
    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    const hours =
        String(
            now.getHours()
        ).padStart(2, "0");

    const minutes =
        String(
            now.getMinutes()
        ).padStart(2, "0");

    const seconds =
        String(
            now.getSeconds()
        ).padStart(2, "0");

    return (
        `factory_manager_` +
        `${year}-${month}-${day}_` +
        `${hours}-${minutes}-${seconds}.db`
    );
}


async function cleanupOldBackups(
    backupDirectory: string
): Promise<void> {
    const entries =
        await readDir(
            backupDirectory
        );

    const backups =
        entries
            .filter(
                (entry) =>
                    entry.isFile &&
                    entry.name?.startsWith(
                        "factory_manager_"
                    ) &&
                    entry.name?.endsWith(
                        ".db"
                    )
            )
            .sort(
                (a, b) =>
                    (b.name ?? "").localeCompare(
                        a.name ?? ""
                    )
            );

    const backupsToDelete =
        backups.slice(
            MAX_BACKUPS
        );

    for (
        const backup
        of backupsToDelete
    ) {
        if (!backup.name) {
            continue;
        }

        const backupPath =
            await join(
                backupDirectory,
                backup.name
            );

        await remove(
            backupPath
        );

        console.log(
            "Backup antiguo eliminado:",
            backupPath
        );
    }
}


export async function createAutomaticBackup(): Promise<void> {
    if (backupInProgress) {
        console.log(
            "Ya hay un backup en progreso."
        );

        return;
    }

    backupInProgress = true;

    try {
        const backupDirectory =
            await getBackupDirectory();

        const fileName =
            createBackupFileName();

        const backupPath =
            await join(
                backupDirectory,
                fileName
            );

        await createDatabaseBackup(
            backupPath
        );

        await cleanupOldBackups(
            backupDirectory
        );

        console.log(
            "Backup automático completado:",
            backupPath
        );

    } catch (error) {
        console.error(
            "Error creando backup automático:",
            error
        );

    } finally {
        backupInProgress = false;
    }
}


export async function startAutomaticBackups(): Promise<void> {
    if (backupTimer !== null) {
        return;
    }

    /*
     * Backup inicial
     */
    await createAutomaticBackup();

    /*
     * Backups posteriores cada 30 minutos
     */
    backupTimer =
        window.setInterval(
            () => {
                void createAutomaticBackup();
            },
            BACKUP_INTERVAL_MS
        );

    console.log(
        "Backups automáticos activados. " +
        "Intervalo: 30 minutos."
    );
}


export function stopAutomaticBackups(): void {
    if (backupTimer === null) {
        return;
    }

    window.clearInterval(
        backupTimer
    );

    backupTimer = null;

    console.log(
        "Backups automáticos detenidos."
    );
}