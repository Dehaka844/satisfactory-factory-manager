import {
    createSection,
    updateSectionContent,
    deleteSection,
    Section
} from "../database/sections";

import {
    sanitizeEditorHtml
} from "../editor/sanitize";


export interface SectionEditorUIOptions {
    getCurrentFactoryId: () => number | null;
    reloadFactory: () => Promise<void>;
}


let currentFactoryId: number | null = null;

let activeEditor: HTMLElement | null = null;

const dirtyEditors =
    new Map<number, HTMLElement>();

const saveTimers =
    new Map<number, number>();


let sectionDialog:
    HTMLDivElement | null = null;

let sectionForm:
    HTMLFormElement | null = null;

let sectionTitleInput:
    HTMLInputElement | null = null;

let cancelSectionButton:
    HTMLButtonElement | null = null;

let deleteSectionDialog:
    HTMLDivElement | null = null;

let deleteSectionTitle:
    HTMLElement | null = null;

let cancelDeleteSectionButton:
    HTMLButtonElement | null = null;

let confirmDeleteSectionButton:
    HTMLButtonElement | null = null;

let sectionPendingDeletion:
    Section | null = null;


let reloadFactory:
    (() => Promise<void>) | null = null;


export function configureSectionEditorUI(
    options: SectionEditorUIOptions
): void {

    reloadFactory =
        options.reloadFactory;

    currentFactoryId =
        options.getCurrentFactoryId();

    sectionDialog =
        document.querySelector<HTMLDivElement>(
            "#section-dialog"
        );

    sectionForm =
        document.querySelector<HTMLFormElement>(
            "#section-form"
        );

    sectionTitleInput =
        document.querySelector<HTMLInputElement>(
            "#section-title"
        );

    cancelSectionButton =
        document.querySelector<HTMLButtonElement>(
            "#cancel-section-button"
        );

    deleteSectionDialog =
        document.querySelector<HTMLDivElement>(
            "#delete-section-dialog"
        );

    deleteSectionTitle =
        document.querySelector<HTMLElement>(
            "#delete-section-title"
        );

    cancelDeleteSectionButton =
        document.querySelector<HTMLButtonElement>(
            "#cancel-delete-section-button"
        );

    confirmDeleteSectionButton =
        document.querySelector<HTMLButtonElement>(
            "#confirm-delete-section-button"
        );


    sectionForm?.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (!sectionForm) {
                return;
            }

            if (!sectionTitleInput) {
                return;
            }

            const factoryId =
                currentFactoryId;

            if (!factoryId) {
                return;
            }

            const title =
                sectionTitleInput.value.trim();

            if (!title) {
                return;
            }

            await createSection(
                factoryId,
                title
            );

            closeSectionDialog();

            if (reloadFactory) {
                await reloadFactory();
            }
        }
    );


    cancelSectionButton?.addEventListener(
        "click",
        () => {
            closeSectionDialog();
        }
    );


    confirmDeleteSectionButton?.addEventListener(
        "click",
        async () => {

            if (!sectionPendingDeletion) {
                return;
            }

            if (!currentFactoryId) {
                return;
            }

            const sectionId =
                sectionPendingDeletion.id;

            await deleteSection(
                sectionId
            );

            closeDeleteSectionDialog();

            if (reloadFactory) {
                await reloadFactory();
            }
        }
    );


    cancelDeleteSectionButton?.addEventListener(
        "click",
        () => {
            closeDeleteSectionDialog();
        }
    );
}


export function updateSectionEditorFactoryId(
    factoryId: number | null
): void {

    currentFactoryId =
        factoryId;
}


export function setupSectionEditorEvents(
    sections: Section[]
): void {

    const deleteSectionButtons =
        document.querySelectorAll<HTMLButtonElement>(
            ".delete-section-button"
        );

    deleteSectionButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const sectionId =
                        Number(
                            button.dataset.sectionId
                        );

                    const section =
                        sections.find(
                            (item) =>
                                item.id === sectionId
                        );

                    if (!section) {
                        return;
                    }

                    openDeleteSectionDialog(
                        section
                    );
                }
            );
        }
    );


    const addSectionButton =
        document.querySelector<HTMLButtonElement>(
            "#add-section-button"
        );

    addSectionButton?.addEventListener(
        "click",
        () => {
            openSectionDialog();
        }
    );


    const editors =
        document.querySelectorAll<HTMLElement>(
            ".section-editor-content"
        );

    editors.forEach(
        (editor) => {

            editor.addEventListener(
                "focus",
                () => {

                    activeEditor =
                        editor;

                    updateEditorToolbarState(
                        editor
                    );
                }
            );


            editor.addEventListener(
                "click",
                () => {

                    activeEditor =
                        editor;

                    updateEditorToolbarState(
                        editor
                    );
                }
            );


            editor.addEventListener(
                "keyup",
                () => {

                    activeEditor =
                        editor;

                    updateEditorToolbarState(
                        editor
                    );
                }
            );


            editor.addEventListener(
                "input",
                () => {

                    activeEditor =
                        editor;

                    markEditorDirty(
                        editor
                    );
                }
            );


            editor.addEventListener(
                "blur",
                async () => {

                    try {

                        await saveEditorContent(
                            editor
                        );

                    } catch (error) {

                        console.error(
                            "Error guardando contenido de la sección:",
                            error
                        );
                    }

                    if (
                        activeEditor ===
                        editor
                    ) {
                        activeEditor = null;
                    }
                }
            );
        }
    );


    const editorButtons =
        document.querySelectorAll<HTMLButtonElement>(
            ".editor-button"
        );

    editorButtons.forEach(
        (button) => {

            button.addEventListener(
                "mousedown",
                (event) => {
                    event.preventDefault();
                }
            );


            button.addEventListener(
                "click",
                () => {

                    const command =
                        button.dataset.command;

                    if (!command) {
                        return;
                    }

                    const value =
                        button.dataset.value ??
                        null;

                    executeEditorCommand(
                        command,
                        value
                    );
                }
            );
        }
    );
}


function markEditorDirty(
    editor: HTMLElement
): void {
    const sectionId = Number(
        editor.dataset.sectionId
    );

    if (!sectionId) {
        return;
    }

    dirtyEditors.set(
        sectionId,
        editor
    );

    const existingTimer =
        saveTimers.get(sectionId);

    if (existingTimer !== undefined) {
        window.clearTimeout(
            existingTimer
        );
    }

    const timer =
        window.setTimeout(
            async () => {
                try {
                    await saveEditorContent(
                        editor
                    );
                } catch (error) {
                    console.error(
                        `Error guardando automáticamente la sección ${sectionId}:`,
                        error
                    );
                }

                saveTimers.delete(
                    sectionId
                );
            },
            500
        );

    saveTimers.set(
        sectionId,
        timer
    );
}


async function saveEditorContent(
    editor: HTMLElement
): Promise<void> {
    const sectionId = Number(
        editor.dataset.sectionId
    );

    if (!sectionId) {
        return;
    }

    const sanitizedHtml =
        sanitizeEditorHtml(
            editor.innerHTML
        );

    await updateSectionContent(
        sectionId,
        sanitizedHtml
    );

    dirtyEditors.delete(sectionId);

    console.log(
        `Contenido de sección ${sectionId} guardado`
    );
}


function openSectionDialog(): void {

    if (!sectionDialog) {
        return;
    }

    if (!sectionForm) {
        return;
    }

    if (!sectionTitleInput) {
        return;
    }

    sectionForm.reset();

    sectionDialog.classList.remove("hidden");

    sectionTitleInput.focus();
}


function closeSectionDialog(): void {

    if (!sectionDialog) {
        return;
    }

    sectionDialog.classList.add("hidden");

    sectionForm?.reset();
}


function openDeleteSectionDialog(section: Section): void {
    if (!deleteSectionDialog) {
        return;
    }

    if (!deleteSectionTitle) {
        return;
    }

    sectionPendingDeletion = section;

    deleteSectionTitle.textContent =
        section.title || "Sin título";

    deleteSectionDialog.classList.remove("hidden");
}


function closeDeleteSectionDialog(): void {
    if (!deleteSectionDialog) {
        return;
    }

    deleteSectionDialog.classList.add("hidden");

    sectionPendingDeletion = null;
}


function getActiveEditor(): HTMLElement | null {
    if (activeEditor) {
        return activeEditor;
    }

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
        return null;
    }

    const node = selection.anchorNode;

    if (!node) {
        return null;
    }

    const element =
        node.nodeType === Node.TEXT_NODE
            ? node.parentElement
            : node as HTMLElement;

    return element?.closest(
        ".section-editor-content"
    ) ?? null;
}


function executeEditorCommand(
    command: string,
    value: string | null = null
): void {
    const editor = getActiveEditor();

    if (!editor) {
        return;
    }

    editor.focus();

    if (command === "formatBlock") {
        if (!value) {
            return;
        }

        document.execCommand(
            "formatBlock",
            false,
            `<${value}>`
        );

        markEditorDirty(
            editor
        );

        updateEditorToolbarState(
            editor
        );

        return;
    }

    document.execCommand(
        command,
        false,
        value ?? undefined
    );

    markEditorDirty(
        editor
    );

    updateEditorToolbarState(
        editor
    );
}


function updateEditorToolbarState(editor: HTMLElement): void {
    const toolbar =
        editor.closest(".section-editor")
            ?.querySelectorAll<HTMLButtonElement>(".editor-button");

    if (!toolbar) {
        return;
    }

    toolbar.forEach((button) => {
        const command = button.dataset.command;

        if (!command) {
            return;
        }

        let active = false;

        if (
            command === "bold" ||
            command === "italic" ||
            command === "underline" ||
            command === "insertUnorderedList" ||
            command === "insertOrderedList"
        ) {
            active = document.queryCommandState(command);
        }

        if (command === "formatBlock") {
            const value = button.dataset.value;

            if (value) {
                const currentBlock =
                    document.queryCommandValue("formatBlock");

                active =
                    currentBlock.toLowerCase() === value.toLowerCase();
            }
        }

        button.classList.toggle(
            "editor-button-active",
            active
        );
    });
}