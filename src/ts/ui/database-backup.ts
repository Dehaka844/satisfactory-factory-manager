import {
    exportDatabaseBackup
} from "../database/factory_export";

export function configureDatabaseBackupUI(): void {

    document.addEventListener(
        "click",
        async (event) => {

            const target =
                event.target;

            if (
                !(target instanceof HTMLElement)
            ) {
                return;
            }

            const button =
                target.closest<HTMLElement>(
                    "#backup-database-button"
                );

            if (!button) {
                return;
            }

            try {

                await exportDatabaseBackup();

            } catch (error) {

                console.error(
                    "Error creando backup:",
                    error
                );
            }
        }
    );
}