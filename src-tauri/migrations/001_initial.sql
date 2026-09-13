PRAGMA foreign_keys = ON;

CREATE TABLE factories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    factory_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (factory_id)
        REFERENCES factories(id)
        ON DELETE CASCADE
);

CREATE TABLE resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE production_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    factory_id INTEGER NOT NULL,
    reference_number INTEGER NOT NULL,
    machine_id INTEGER NOT NULL,
    machine_count REAL NOT NULL DEFAULT 1,
    recipe_id INTEGER,
    production_percentage REAL NOT NULL DEFAULT 100,
    power_shards INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (factory_id)
        REFERENCES factories(id)
        ON DELETE CASCADE,

    FOREIGN KEY (machine_id)
        REFERENCES machines(id),

    FOREIGN KEY (recipe_id)
        REFERENCES recipes(id)
);

CREATE TABLE production_inputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_line_id INTEGER NOT NULL,
    resource_id INTEGER NOT NULL,
    amount_per_machine REAL NOT NULL DEFAULT 0,

    FOREIGN KEY (production_line_id)
        REFERENCES production_lines(id)
        ON DELETE CASCADE,

    FOREIGN KEY (resource_id)
        REFERENCES resources(id)
);

CREATE TABLE production_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_line_id INTEGER NOT NULL,
    resource_id INTEGER NOT NULL,
    amount_per_machine REAL NOT NULL DEFAULT 0,

    FOREIGN KEY (production_line_id)
        REFERENCES production_lines(id)
        ON DELETE CASCADE,

    FOREIGN KEY (resource_id)
        REFERENCES resources(id)
);

CREATE INDEX idx_sections_factory
    ON sections(factory_id);

CREATE INDEX idx_production_lines_factory
    ON production_lines(factory_id);

CREATE INDEX idx_production_inputs_line
    ON production_inputs(production_line_id);

CREATE INDEX idx_production_inputs_resource
    ON production_inputs(resource_id);

CREATE INDEX idx_production_outputs_line
    ON production_outputs(production_line_id);

CREATE INDEX idx_production_outputs_resource
    ON production_outputs(resource_id);