import {
    calculateProductionAmount,
    formatProductionAmount,
    ProductionStructure,
    FactoryResourceSummary
} from "../database/production_queries";


export function renderProductionTable(
    structures: ProductionStructure[]
): string {
    const rows = structures
        .map((item) => {
            const structure = item.structure;

            return `
                <tr
                    class="production-row"
                    data-production-id="${structure.id}"
                >
                    <td class="production-expand-cell">
                        <button
                            type="button"
                            class="production-expand-button"
                            data-production-toggle="${structure.id}"
                            aria-expanded="false"
                            aria-label="Mostrar detalles"
                        >
                            ▶
                        </button>
                    </td>

                    <td>
                        <strong>${structure.reference_number}</strong>
                    </td>

                    <td>
                        ${structure.machine_name}
                    </td>

                    <td>
                        ${formatProductionAmount(
                            structure.machine_count
                        )}
                    </td>

                    <td>
                        ${structure.recipe_name ?? "—"}
                    </td>

                    <td>
                        ${formatProductionAmount(
                            structure.production_percentage
                        )}%
                    </td>

                    <td>
                        ${structure.power_shards}
                    </td>
                </tr>

                <tr
                    class="production-detail-row"
                    data-production-detail="${structure.id}"
                    hidden
                >
                    <td colspan="7">
                        ${renderProductionDetail(item)}
                    </td>
                </tr>
            `;
        })
        .join("");

    return `
        <section class="production-section">
            <div class="production-section-header">
                <h2>Producción</h2>

                <button
                    type="button"
                    id="new-structure-button"
                    class="primary-button"
                >
                    📌 Nueva estructura
                </button>
            </div>

            ${
                structures.length === 0
                    ? `
                        <div class="production-empty">
                            No hay estructuras de producción en esta fábrica.
                        </div>
                    `
                    : `
                        <div class="production-table-wrapper">
                            <table class="production-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Ref.</th>
                                        <th>Maquinaria</th>
                                        <th>Cantidad</th>
                                        <th>Receta</th>
                                        <th>Producción</th>
                                        <th>Esquirlas</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                        </div>
                    `
            }
        </section>
    `;
}


export function renderFactoryResourceSummary(
    summary: FactoryResourceSummary
): string {
    if (summary.resources.length === 0) {
        return `
            <section class="factory-resources-section">
                <div class="factory-resources-section-header">
                    <h2>Recursos de la fábrica</h2>
                </div>

                <div class="factory-resources-empty">
                    No hay recursos de producción en esta fábrica.
                </div>
            </section>
        `;
    }

    const rows = summary.resources
        .map((resource) => {
            const overflowClass =
                resource.overflow_per_minute > 0
                    ? "resource-overflow-positive"
                    : resource.overflow_per_minute < 0
                        ? "resource-overflow-negative"
                        : "resource-overflow-balanced";

            const overflowPrefix =
                resource.overflow_per_minute > 0
                    ? "+"
                    : "";

            return `
                <tr>
                    <td>
                        <strong>
                            ${resource.resource_name}
                        </strong>
                    </td>

                    <td>
                        ${formatProductionAmount(
                            resource.production_per_minute
                        )}/min
                    </td>

                    <td>
                        ${formatProductionAmount(
                            resource.consumption_per_minute
                        )}/min
                    </td>

                    <td>
                        <div class="factory-resource-storage-input">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value="${resource.storage_per_minute}"
                                data-resource-storage="${resource.resource_id}"
                                aria-label="Almacenamiento de ${resource.resource_name}"
                            />

                            <span>/min</span>
                        </div>
                    </td>

                    <td class="${overflowClass}">
                        ${overflowPrefix}${formatProductionAmount(
                            resource.overflow_per_minute
                        )}/min
                    </td>
                </tr>
            `;
        })
        .join("");

    return `
        <section class="factory-resources-section">
            <div class="factory-resources-section-header">
                <h2>Recursos de la fábrica</h2>
            </div>

            <div class="factory-resources-table-wrapper">
                <table class="factory-resources-table">
                    <thead>
                        <tr>
                            <th>Recurso</th>
                            <th>Producción</th>
                            <th>Consumo</th>
                            <th>Almacenado</th>
                            <th>Overflow</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>

            <div class="factory-resources-summary">
                <span>
                    ✓ Recursos con excedente:
                    <strong>${summary.surplus_count}</strong>
                </span>

                <span>
                    ⚠ Recursos con déficit:
                    <strong>${summary.deficit_count}</strong>
                </span>
            </div>
        </section>
    `;
}


export function renderProductionDetail(
    item: ProductionStructure
): string {
    const structure = item.structure;

    const inputsHtml =
        item.inputs.length > 0
            ? item.inputs
                  .map((input) => {
                      const amount =
                          calculateProductionAmount(
                              structure.machine_count,
                              input.amount_per_machine,
                              structure.production_percentage
                          );

                      return `
                          <div class="production-resource">
                              <span>
                                  ${input.resource_name}
                              </span>

                              <strong>
                                  ${formatProductionAmount(amount)}/min
                              </strong>
                          </div>
                      `;
                  })
                  .join("")
            : `
                <div class="production-resource-empty">
                    Sin entradas
                </div>
            `;

    const outputsHtml =
        item.outputs.length > 0
            ? item.outputs
                  .map((output) => {
                      const amount =
                          calculateProductionAmount(
                              structure.machine_count,
                              output.amount_per_machine,
                              structure.production_percentage
                          );

                      return `
                          <div class="production-resource">
                              <span>
                                  ${output.resource_name}
                              </span>

                              <strong>
                                  ${formatProductionAmount(amount)}/min
                              </strong>
                          </div>
                      `;
                  })
                  .join("")
            : `
                <div class="production-resource-empty">
                    Sin salidas
                </div>
            `;

    return `
        <div class="production-detail">
            <div class="production-detail-column">
                <h4>Entradas</h4>

                <div class="production-resource-list">
                    ${inputsHtml}
                </div>
            </div>

            <div class="production-detail-column">
                <h4>Salidas</h4>

                <div class="production-resource-list">
                    ${outputsHtml}
                </div>
            </div>
        </div>

        <div class="production-detail-actions">
            <button
                type="button"
                class="secondary-button"
                data-production-edit="${structure.id}"
            >
                ✏️ Editar
            </button>

            <button
                type="button"
                class="dialog-button danger"
                data-production-delete="${structure.id}"
            >
                🗑️ Eliminar
            </button>

        </div>

    `;
}