export interface SearchableSelectItem {
    id: number;
    name: string;
}

export interface SearchableSelectOptions {
    items: SearchableSelectItem[];
    placeholder?: string;
    onChange?: (
        item: SearchableSelectItem | null
    ) => void;
}

export interface SearchableSelectInstance {
    element: HTMLElement;

    getValue(): SearchableSelectItem | null;

    setValue(id: number | null): void;

    setItems(
        items: SearchableSelectItem[]
    ): void;

    destroy(): void;
}

export function createSearchableSelect(
    options: SearchableSelectOptions
): SearchableSelectInstance {
    let items = [...options.items];

    let selectedItem: SearchableSelectItem | null = null;

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "searchable-select";

    const trigger =
        document.createElement("button");

    trigger.type = "button";

    trigger.className =
        "searchable-select-trigger";

    const triggerText =
        document.createElement("span");

    triggerText.className =
        "searchable-select-trigger-text";

    triggerText.textContent =
        options.placeholder ??
        "Seleccionar...";

    const triggerIcon =
        document.createElement("span");

    triggerIcon.className =
        "searchable-select-trigger-icon";

    triggerIcon.textContent = "▼";

    trigger.append(
        triggerText,
        triggerIcon
    );

    const dropdown =
        document.createElement("div");

    dropdown.className =
        "searchable-select-dropdown";

    const searchInput =
        document.createElement("input");

    searchInput.type = "text";

    searchInput.className =
        "searchable-select-search";

    searchInput.placeholder =
        options.placeholder ??
        "Buscar...";

    const optionsContainer =
        document.createElement("div");

    optionsContainer.className =
        "searchable-select-options";

    dropdown.append(
        searchInput,
        optionsContainer
    );

    wrapper.append(
        trigger,
        dropdown
    );

    function renderOptions(
        searchTerm: string = ""
    ): void {
        optionsContainer.innerHTML = "";

        const normalizedSearch =
            searchTerm
                .trim()
                .toLowerCase();

        const filteredItems =
            items.filter((item) =>
                item.name
                    .toLowerCase()
                    .includes(normalizedSearch)
            );

        if (filteredItems.length === 0) {
            const emptyMessage =
                document.createElement("div");

            emptyMessage.className =
                "searchable-select-empty";

            emptyMessage.textContent =
                "No se encontraron resultados.";

            optionsContainer.append(
                emptyMessage
            );

            return;
        }

        filteredItems.forEach((item) => {
            const option =
                document.createElement("button");

            option.type = "button";

            option.className =
                "searchable-select-option";

            option.textContent =
                item.name;

            if (
                selectedItem &&
                selectedItem.id === item.id
            ) {
                option.classList.add(
                    "searchable-select-option-selected"
                );
            }

            option.addEventListener(
                "click",
                () => {
                    selectedItem = item;

                    triggerText.textContent =
                        item.name;

                    closeDropdown();

                    options.onChange?.(
                        item
                    );
                }
            );

            optionsContainer.append(
                option
            );
        });
    }

    function openDropdown(): void {
        dropdown.classList.add(
            "searchable-select-dropdown-open"
        );

        trigger.classList.add(
            "searchable-select-trigger-open"
        );

        searchInput.value = "";

        renderOptions();

        requestAnimationFrame(() => {
            searchInput.focus();
        });
    }

    function closeDropdown(): void {
        dropdown.classList.remove(
            "searchable-select-dropdown-open"
        );

        trigger.classList.remove(
            "searchable-select-trigger-open"
        );
    }

    function toggleDropdown(): void {
        const isOpen =
            dropdown.classList.contains(
                "searchable-select-dropdown-open"
            );

        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    function handleDocumentClick(
        event: MouseEvent
    ): void {
        const target =
            event.target as Node;

        if (!wrapper.contains(target)) {
            closeDropdown();
        }
    }

    trigger.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            toggleDropdown();
        }
    );

    searchInput.addEventListener(
        "input",
        () => {
            renderOptions(
                searchInput.value
            );
        }
    );

    searchInput.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
        }
    );

    document.addEventListener(
        "click",
        handleDocumentClick
    );

    function getValue():
        SearchableSelectItem | null {
        return selectedItem;
    }

    function setValue(
        id: number | null
    ): void {
        if (id === null) {
            selectedItem = null;

            triggerText.textContent =
                options.placeholder ??
                "Seleccionar...";

            return;
        }

        const item =
            items.find(
                (currentItem) =>
                    currentItem.id === id
            );

        if (!item) {
            selectedItem = null;

            triggerText.textContent =
                options.placeholder ??
                "Seleccionar...";

            return;
        }

        selectedItem = item;

        triggerText.textContent =
            item.name;
    }

    function setItems(
        newItems: SearchableSelectItem[]
    ): void {
        items = [...newItems];

        if (
            selectedItem &&
            !items.some(
                (item) =>
                    item.id ===
                    selectedItem?.id
            )
        ) {
            selectedItem = null;

            triggerText.textContent =
                options.placeholder ??
                "Seleccionar...";
        }

        if (
            dropdown.classList.contains(
                "searchable-select-dropdown-open"
            )
        ) {
            renderOptions(
                searchInput.value
            );
        }
    }

    function destroy(): void {
        document.removeEventListener(
            "click",
            handleDocumentClick
        );

        wrapper.remove();
    }

    renderOptions();

    return {
        element: wrapper,
        getValue,
        setValue,
        setItems,
        destroy
    };
}