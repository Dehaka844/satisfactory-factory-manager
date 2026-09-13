# Satisfactory Factory Manager

Aplicación de escritorio para gestionar fábricas de **Satisfactory**, sus secciones, estructuras de producción, recursos, máquinas y recetas.

## Tecnologías

* **Tauri v2** — aplicación de escritorio y capa nativa.
* **TypeScript** — lógica del frontend.
* **Vite** — desarrollo y compilación del frontend.
* **HTML/CSS** — interfaz de usuario.
* **SQLite** — base de datos local.
* **Rust** — capa nativa de Tauri.

### Plugins Tauri

* `tauri-plugin-sql`
* `tauri-plugin-dialog`
* `tauri-plugin-fs`
* `tauri-plugin-opener`

---

## Requisitos

Para desarrollar y compilar el proyecto es necesario tener instalado:

* Node.js
* npm
* Rust
* Cargo
* Las herramientas de desarrollo necesarias para Tauri v2 en el sistema operativo de destino.

---

## Instalación

Clonar o copiar el proyecto y acceder a su directorio:

```bash
cd satisfactory-factory-manager
```

Instalar las dependencias de Node.js:

```bash
npm install
```

Las dependencias de Rust están definidas en:

```text
src-tauri/Cargo.toml
```

Cargo las descargará automáticamente durante la compilación.

---

## Estructura del proyecto

```text
satisfactory-factory-manager/
│
├── index.html
├── package.json
│
├── src/
│   ├── css/
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── dialogs.css
│   │   ├── factory.css
│   │   ├── searchable-select.css
│   │   ├── production.css
│   │   ├── catalogs.css
│   │   └── main.css
│   │
│   └── ts/
│       ├── main.ts
│       ├── database/
│       ├── editor/
│       └── ui/
│
└── src-tauri/
    ├── capabilities/
    ├── migrations/
    ├── src/
    ├── Cargo.toml
    └── tauri.conf.json
```

---

## Desarrollo

### Ejecutar Vite

Para iniciar únicamente el servidor de desarrollo del frontend:

```bash
npm run dev
```

La aplicación está configurada para utilizar:

```text
http://localhost:1420
```

### Ejecutar la aplicación Tauri

Para iniciar la aplicación completa en modo desarrollo:

```bash
npx tauri dev
```

Si `package.json` contiene el script correspondiente:

```bash
npm run tauri dev
```

---

## Compilación del frontend

Para compilar el frontend:

```bash
npm run build
```

El resultado se genera en:

```text
dist/
```

Tauri utiliza este directorio como distribución del frontend.

La configuración de `src-tauri/tauri.conf.json` contiene:

```json
"frontendDist": "../dist"
```

---

## Crear el ejecutable

Para generar una versión distribuible de la aplicación:

```bash
npx tauri build
```

Si existe el script correspondiente:

```bash
npm run tauri build
```

Durante este proceso Tauri:

1. Compila el frontend.
2. Compila el código Rust.
3. Genera la aplicación de escritorio.
4. Genera los paquetes e instaladores correspondientes.

La configuración ejecuta automáticamente:

```bash
npm run build
```

antes de la compilación final mediante:

```json
"beforeBuildCommand": "npm run build"
```

### Archivos generados

Los archivos generados por Rust y Tauri se encuentran normalmente en:

```text
src-tauri/target/release/
```

Los paquetes e instaladores se encuentran normalmente en:

```text
src-tauri/target/release/bundle/
```

Los formatos generados dependen del sistema operativo desde el que se realice la compilación.

---

## Configuración de Tauri

La configuración principal está en:

```text
src-tauri/tauri.conf.json
```

### Valores actuales

| Propiedad     | Valor                             |
| ------------- | --------------------------------- |
| Producto      | `satisfactory-factory-manager`    |
| Versión       | `0.1.0`                           |
| Identificador | `com.satisfactory.factorymanager` |
| Ventana       | `800 x 600`                       |

### Configuración de desarrollo

```text
beforeDevCommand:   npm run dev
devUrl:             http://localhost:1420
beforeBuildCommand: npm run build
frontendDist:       ../dist
```

El bundling está activado:

```json
"bundle": {
    "active": true,
    "targets": "all"
}
```

---

## Versión

La versión actual del proyecto es:

```text
1.0.0
```

Está definida en:

```text
src-tauri/tauri.conf.json
src-tauri/Cargo.toml
```

Al preparar una nueva versión, ambos valores deben mantenerse sincronizados.

---

# Base de datos

La aplicación utiliza SQLite mediante:

```text
tauri-plugin-sql
```

La conexión está centralizada en:

```text
src/ts/database/database.ts
```

La base de datos utilizada es:

```text
sqlite:factory_manager.db
```

La aplicación mantiene una instancia reutilizable de la conexión durante su ejecución.

---

## Migraciones

Las migraciones actuales son:

```text
001_initial.sql
002_seed_catalogs.sql
003_factory_resources.sql
```

### `001_initial.sql`

Crea las tablas principales:

* `factories`
* `sections`
* `resources`
* `machines`
* `recipes`
* `production_lines`
* `production_inputs`
* `production_outputs`

También crea los índices necesarios y activa:

```sql
PRAGMA foreign_keys = ON;
```

### `002_seed_catalogs.sql`

Contiene actualmente datos de prueba para:

* `resources`
* `machines`
* `recipes`

Estos datos son provisionales.

Antes de una versión definitiva deben sustituirse por los datos reales de Satisfactory.

### `003_factory_resources.sql`

Añade la tabla:

```text
factory_resources
```

que almacena la configuración de almacenamiento de recursos de cada fábrica.

---

## Datos de prueba

Los registros actuales de:

```text
002_seed_catalogs.sql
```

son únicamente datos de prueba.

Antes de preparar una versión definitiva:

1. Eliminar los datos de prueba.
2. Introducir los recursos reales.
3. Introducir las máquinas reales.
4. Introducir las recetas reales.
5. Comprobar las relaciones entre ellos.
6. Realizar una instalación limpia.
7. Comprobar que las migraciones funcionan correctamente.

> El contenido actual de `002_seed_catalogs.sql` no debe considerarse el catálogo definitivo.

---

## Modelo de datos

La estructura general de relaciones es:

```text
factories
│
├── sections
│
├── production_lines
│   │
│   ├── production_inputs ──> resources
│   │
│   └── production_outputs ─> resources
│
└── factory_resources ──────> resources
```

Las líneas de producción también están relacionadas con:

```text
production_lines
│
├── machines
└── recipes
```

### Catálogos globales

Los siguientes elementos forman catálogos globales:

* `resources`
* `machines`
* `recipes`

### Elementos pertenecientes a una fábrica

Los siguientes elementos pertenecen a una fábrica:

* `sections`
* `production_lines`
* `production_inputs`
* `production_outputs`
* `factory_resources`

---

# Backups

La aplicación dispone de dos sistemas de backup.

## Backup manual

Desde la interfaz se puede crear un backup manual de la base de datos.

El usuario selecciona la ubicación donde guardar el archivo.

La copia se genera mediante SQLite:

```sql
VACUUM INTO
```

Esto crea una copia independiente de la base de datos.

## Backup automático

El sistema de backups automáticos está implementado en:

```text
src/ts/database/database_backups.ts
```

Actualmente:

* Se crea un backup al iniciar la aplicación.
* Se crea otro cada 30 minutos.
* Se conservan como máximo 10 backups automáticos.
* Se eliminan los backups más antiguos cuando se supera ese límite.
* Se evita ejecutar dos backups automáticos simultáneamente.

Los backups automáticos se almacenan dentro del directorio de datos de la aplicación:

```text
backups/
```

Los archivos utilizan el formato:

```text
factory_manager_YYYY-MM-DD_HH-MM-SS.db
```

Por ejemplo:

```text
factory_manager_2026-09-12_12-30-00.db
```

---

# Permisos Tauri

Los permisos de la aplicación están definidos en:

```text
src-tauri/capabilities/default.json
```

La capability está asociada a la ventana:

```text
main
```

Los permisos principales son:

```text
core:default
opener:default
sql:default
sql:allow-execute
dialog:default
fs:default
fs:allow-write-text-file
fs:allow-read-text-file
fs:allow-remove
```

Los permisos de filesystem permiten realizar las operaciones necesarias para:

* Importar archivos.
* Exportar archivos.
* Crear backups.
* Eliminar backups antiguos.

El permiso:

```text
fs:allow-remove
```

es necesario para que el sistema de backups automáticos pueda eliminar los backups antiguos.

---

# Importación y exportación

La aplicación permite exportar una fábrica a JSON e importarla posteriormente.

La exportación se encuentra principalmente en:

```text
src/ts/database/factory_export.ts
```

La importación se encuentra en:

```text
src/ts/database/factory_import.ts
```

El formato de exportación utiliza:

```json
{
    "format": "satisfactory-factory-manager",
    "version": 1
}
```

La información exportada incluye:

* Nombre de la fábrica.
* Descripción.
* Secciones.
* Recursos.
* Almacenamiento.
* Líneas de producción.
* Máquinas.
* Recetas.
* Inputs.
* Outputs.
* Porcentaje de producción.
* Power Shards.

La importación valida el formato y la versión antes de insertar los datos.

La creación de la fábrica importada se realiza dentro de una transacción para evitar dejar datos parcialmente importados si se produce un error.

---

# Comprobaciones antes de una release

Antes de generar una versión distribuible se recomienda ejecutar:

```bash
npm install
npm run build
npx tauri build
```

Después se debe instalar y probar la aplicación generada.

Como mínimo deben comprobarse:

* [ ] Crear fábrica.
* [ ] Editar fábrica.
* [ ] Eliminar fábrica.
* [ ] Crear sección.
* [ ] Editar sección.
* [ ] Guardar contenido del editor.
* [ ] Eliminar sección.
* [ ] Crear estructura de producción.
* [ ] Editar estructura de producción.
* [ ] Eliminar estructura de producción.
* [ ] Modificar almacenamiento de recursos.
* [ ] Exportar fábrica.
* [ ] Importar fábrica.
* [ ] Crear backup manual.
* [ ] Crear backup automático.
* [ ] Comprobar eliminación de backups antiguos.

---

# Preparación de una versión definitiva

## 1. Catálogos

Sustituir los datos de prueba de:

```text
002_seed_catalogs.sql
```

por los datos reales.

Deben revisarse especialmente:

* `resources`
* `machines`
* `recipes`

## 2. Base de datos limpia

Realizar una instalación con una base de datos nueva y comprobar que todas las migraciones se ejecutan correctamente:

```text
001_initial.sql
002_seed_catalogs.sql
003_factory_resources.sql
```

## 3. Funcionalidades

Probar todas las operaciones principales:

* Fábricas.
* Secciones.
* Producción.
* Recursos.
* Importación.
* Exportación.
* Backups.

## 4. Compilación

Ejecutar:

```bash
npm run build
```

y después:

```bash
npx tauri build
```

## 5. Instalación

Instalar la aplicación generada en un entorno limpio y comprobar que funciona sin depender del entorno de desarrollo.

---

# Comandos principales

### Instalar dependencias

```bash
npm install
```

### Ejecutar Vite

```bash
npm run dev
```

### Ejecutar Tauri en desarrollo

```bash
npx tauri dev
```

### Compilar frontend

```bash
npm run build
```

### Crear ejecutable/instalador

```bash
npx tauri build
```

---

# Archivos importantes

| Área                | Archivo / Directorio                  |
| ------------------- | ------------------------------------- |
| Frontend            | `index.html`                          |
| Punto de entrada    | `src/ts/main.ts`                      |
| Interfaz            | `src/ts/ui/`                          |
| Base de datos       | `src/ts/database/`                    |
| Editor              | `src/ts/editor/`                      |
| Estilos             | `src/css/`                            |
| Migraciones         | `src-tauri/migrations/`               |
| Configuración Tauri | `src-tauri/tauri.conf.json`           |
| Dependencias Rust   | `src-tauri/Cargo.toml`                |
| Permisos            | `src-tauri/capabilities/default.json` |

---

# Principios de desarrollo

El proyecto sigue una separación por responsabilidades.

La lógica específica debe mantenerse en su módulo correspondiente siempre que sea posible.

Por ejemplo:

```text
factories.ts
```

gestiona las operaciones relacionadas con fábricas.

```text
production.ts
```

gestiona las estructuras completas de producción.

```text
database_backups.ts
```

gestiona los backups automáticos.

Los módulos de:

```text
src/ts/ui/
```

gestionan la interacción y representación de la interfaz.

Los módulos de:

```text
src/ts/database/
```

gestionan la persistencia y las operaciones relacionadas con SQLite.

`main.ts` actúa principalmente como coordinador y punto de entrada de la aplicación.

---

# Documentación técnica

La documentación detallada del funcionamiento interno del proyecto se encuentra en:

```text
PROJECT.md
```

Ese documento describe:

* Arquitectura.
* Módulos.
* Flujo de datos.
* Modelo de base de datos.
* Sistema de producción.
* Importación y exportación.
* Backups.
* Editor.
* Comunicación entre módulos.
* Configuración de Tauri.
* Convenciones para ampliar el proyecto.

---

# Estado del proyecto

**Versión actual:** `1.0.0`

**Estado:** En desarrollo

### Funcionalidades actuales

* Gestión de fábricas.
* Creación, edición y eliminación de fábricas.
* Secciones.
* Editor de texto enriquecido.
* Sanitización del contenido del editor.
* Estructuras de producción.
* Máquinas.
* Recetas.
* Recursos.
* Resumen de producción.
* Almacenamiento de recursos.
* Importación de fábricas.
* Exportación de fábricas.
* Backups manuales.
* Backups automáticos.
* Limpieza automática de backups antiguos.
* Base de datos SQLite.
* Migraciones.
* Aplicación de escritorio mediante Tauri.
