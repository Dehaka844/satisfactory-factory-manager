const allowedTags = new Set([
    "P",
    "BR",
    "H1",
    "H2",
    "H3",
    "STRONG",
    "B",
    "EM",
    "I",
    "U",
    "UL",
    "OL",
    "LI"
]);

export function sanitizeEditorHtml(
    html: string
): string {
    const parser = new DOMParser();

    const document =
        parser.parseFromString(
            html,
            "text/html"
        );

    const elements =
        document.body.querySelectorAll("*");

    elements.forEach((element) => {
        if (!allowedTags.has(element.tagName)) {
            element.replaceWith(
                ...Array.from(element.childNodes)
            );

            return;
        }

        Array.from(element.attributes).forEach(
            (attribute) => {
                element.removeAttribute(
                    attribute.name
                );
            }
        );
    });

    return document.body.innerHTML;
}