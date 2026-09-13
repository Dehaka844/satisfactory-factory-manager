import { getDatabase } from "./database";

export interface ProductionStructureRow {
    id: number;
    factory_id: number;
    reference_number: number;

    machine_id: number;
    machine_name: string;
    machine_count: number;

    recipe_id: number | null;
    recipe_name: string | null;

    production_percentage: number;
    power_shards: number;
}

export interface ProductionResourceRow {
    id: number;
    production_line_id: number;
    resource_id: number;
    resource_name: string;
    amount_per_machine: number;
}

export interface ProductionStructure {
    structure: ProductionStructureRow;
    inputs: ProductionResourceRow[];
    outputs: ProductionResourceRow[];
}

export interface FactoryResourceSummaryRow {
    resource_id: number;
    resource_name: string;

    production_per_minute: number;
    consumption_per_minute: number;
    storage_per_minute: number;

    overflow_per_minute: number;
}

export interface FactoryResourceSummary {
    resources: FactoryResourceSummaryRow[];

    surplus_count: number;
    deficit_count: number;
}

export async function getProductionStructuresByFactoryId(
    factoryId: number
): Promise<ProductionStructure[]> {
    const db = await getDatabase();

    const structures =
        await db.select<ProductionStructureRow[]>(
            `
            SELECT
                pl.id,
                pl.factory_id,
                pl.reference_number,

                pl.machine_id,
                m.name AS machine_name,
                pl.machine_count,

                pl.recipe_id,
                r.name AS recipe_name,

                pl.production_percentage,
                pl.power_shards

            FROM production_lines pl

            INNER JOIN machines m
                ON m.id = pl.machine_id

            LEFT JOIN recipes r
                ON r.id = pl.recipe_id

            WHERE pl.factory_id = ?

            ORDER BY
                pl.reference_number ASC,
                pl.id ASC
            `,
            [factoryId]
        );

    const result: ProductionStructure[] = [];

    for (const structure of structures) {
        const inputs =
            await db.select<ProductionResourceRow[]>(
                `
                SELECT
                    pi.id,
                    pi.production_line_id,
                    pi.resource_id,
                    r.name AS resource_name,
                    pi.amount_per_machine

                FROM production_inputs pi

                INNER JOIN resources r
                    ON r.id = pi.resource_id

                WHERE pi.production_line_id = ?

                ORDER BY pi.id ASC
                `,
                [structure.id]
            );

        const outputs =
            await db.select<ProductionResourceRow[]>(
                `
                SELECT
                    po.id,
                    po.production_line_id,
                    po.resource_id,
                    r.name AS resource_name,
                    po.amount_per_machine

                FROM production_outputs po

                INNER JOIN resources r
                    ON r.id = po.resource_id

                WHERE po.production_line_id = ?

                ORDER BY po.id ASC
                `,
                [structure.id]
            );

        result.push({
            structure,
            inputs,
            outputs
        });
    }

    return result;
}

export function calculateProductionAmount(
    machineCount: number,
    amountPerMachine: number,
    productionPercentage: number
): number {
    return (
        machineCount *
        amountPerMachine *
        (productionPercentage / 100)
    );
}

export function formatProductionAmount(
    amount: number
): string {
    if (Number.isInteger(amount)) {
        return String(amount);
    }

    return amount
        .toFixed(2)
        .replace(/\.?0+$/, "");
}

export async function getFactoryResourceSummary(
    factoryId: number
): Promise<FactoryResourceSummary> {
    const db = await getDatabase();

    const rows =
        await db.select<
            {
                resource_id: number;
                resource_name: string;
                production_per_minute: number;
                consumption_per_minute: number;
                storage_per_minute: number;
            }[]
        >(
            `
            SELECT
                r.id AS resource_id,
                r.name AS resource_name,

                COALESCE(
                    (
                        SELECT SUM(
                            po.amount_per_machine
                            * pl.machine_count
                            * (pl.production_percentage / 100.0)
                        )
                        FROM production_outputs po

                        INNER JOIN production_lines pl
                            ON pl.id = po.production_line_id

                        WHERE
                            pl.factory_id = ?
                            AND po.resource_id = r.id
                    ),
                    0
                ) AS production_per_minute,

                COALESCE(
                    (
                        SELECT SUM(
                            pi.amount_per_machine
                            * pl.machine_count
                            * (pl.production_percentage / 100.0)
                        )
                        FROM production_inputs pi

                        INNER JOIN production_lines pl
                            ON pl.id = pi.production_line_id

                        WHERE
                            pl.factory_id = ?
                            AND pi.resource_id = r.id
                    ),
                    0
                ) AS consumption_per_minute,

                COALESCE(
                    (
                        SELECT fr.storage_per_minute
                        FROM factory_resources fr

                        WHERE
                            fr.factory_id = ?
                            AND fr.resource_id = r.id
                    ),
                    0
                ) AS storage_per_minute

            FROM resources r

            WHERE
                EXISTS (
                    SELECT 1
                    FROM production_outputs po
                    INNER JOIN production_lines pl
                        ON pl.id = po.production_line_id
                    WHERE
                        pl.factory_id = ?
                        AND po.resource_id = r.id
                )

                OR EXISTS (
                    SELECT 1
                    FROM production_inputs pi
                    INNER JOIN production_lines pl
                        ON pl.id = pi.production_line_id
                    WHERE
                        pl.factory_id = ?
                        AND pi.resource_id = r.id
                )

                OR EXISTS (
                    SELECT 1
                    FROM factory_resources fr
                    WHERE
                        fr.factory_id = ?
                        AND fr.resource_id = r.id
                )

            ORDER BY r.name ASC
            `,
            [
                factoryId,
                factoryId,
                factoryId,
                factoryId,
                factoryId,
                factoryId
            ]
        );

    const resources: FactoryResourceSummaryRow[] =
        rows.map((row) => {
            const overflow =
                row.production_per_minute -
                row.consumption_per_minute -
                row.storage_per_minute;

            return {
                resource_id: row.resource_id,
                resource_name: row.resource_name,

                production_per_minute:
                    row.production_per_minute,

                consumption_per_minute:
                    row.consumption_per_minute,

                storage_per_minute:
                    row.storage_per_minute,

                overflow_per_minute:
                    overflow
            };
        });

    const surplusCount = resources.filter(
        (resource) => resource.overflow_per_minute > 0
    ).length;

    const deficitCount = resources.filter(
        (resource) => resource.overflow_per_minute < 0
    ).length;

    return {
        resources,
        surplus_count: surplusCount,
        deficit_count: deficitCount
    };
}

export async function setFactoryResourceStorage(
    factoryId: number,
    resourceId: number,
    storagePerMinute: number
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `
        INSERT INTO factory_resources (
            factory_id,
            resource_id,
            storage_per_minute
        )
        VALUES (?, ?, ?)

        ON CONFLICT(factory_id, resource_id)
        DO UPDATE SET
            storage_per_minute = excluded.storage_per_minute
        `,
        [
            factoryId,
            resourceId,
            storagePerMinute
        ]
    );
}