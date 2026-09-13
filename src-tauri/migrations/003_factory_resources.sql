CREATE TABLE factory_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    factory_id INTEGER NOT NULL,
    resource_id INTEGER NOT NULL,

    storage_per_minute REAL NOT NULL DEFAULT 0,

    FOREIGN KEY (factory_id)
        REFERENCES factories(id)
        ON DELETE CASCADE,

    FOREIGN KEY (resource_id)
        REFERENCES resources(id),

    UNIQUE(factory_id, resource_id)
);


CREATE INDEX idx_factory_resources_factory
    ON factory_resources(factory_id);

CREATE INDEX idx_factory_resources_resource
    ON factory_resources(resource_id);