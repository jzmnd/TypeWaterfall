// List of the most common font weight names ordered from lowest to highest weight
const fontWeightOrder = [
    'hairline',
    'thin',
    'ultra light',
    'ultralight',
    'extra light',
    'extralight',
    'light',
    'normal',
    'regular',
    '', // Include blank string to account for Regular Italic which is often just named Italic
    'medium',
    'semi bold',
    'semibold',
    'demi bold',
    'demibold',
    'bold',
    'extra bold',
    'extrabold',
    'ultra bold',
    'ultrabold',
    'black',
    'heavy',
    'ultra',
];

// Event message from the plugin UI
type PluginMessage = {
    type: string;
    frameName: string;
    textContent: string;
    fontSize: number;
    fontFamily: string;
    textStyles: string[];
    textCases: TextCase[];
    IsDescending: boolean;
};

// Default padding amount
const defaultPad = 5;

// This shows the HTML page in "ui.html"
figma.showUI(__html__, { height: 400, width: 350, themeColors: true });

// Extract unique font families and send to the UI to populate the font selector
(async () => {
    const availableFonts = await figma.listAvailableFontsAsync();
    const fontFamilies = [
        ...new Set(availableFonts.map((font) => font.fontName.family)),
    ];
    figma.ui.postMessage({ type: 'font-families', data: fontFamilies });
})();

/**
 * Loads the given list of font names into Figma
 * @param List of font names
 * @returns Resolves when fonts are loaded
 */
async function loadFonts(fonts: FontName[]): Promise<void> {
    for (const font of fonts) {
        await figma.loadFontAsync(font);
    }
}

/**
 * Creates a list of fonts required for the waterfall, ordered by font weight
 * @param Plugin message
 * @returns Returns font names once the fonts are fetched and ordered
 */
async function createFontList(msg: PluginMessage): Promise<FontName[]> {
    const availableFonts = await figma.listAvailableFontsAsync();

    const includeItalic = msg.textStyles.indexOf('italic') !== -1;
    const includeNonItalic = msg.textStyles.indexOf('non-italic') !== -1;

    const filteredFonts = availableFonts.filter(
        (font) =>
            font.fontName.family === msg.fontFamily &&
            ((font.fontName.style.toLowerCase().includes('italic') &&
                includeItalic) ||
                (!font.fontName.style.toLowerCase().includes('italic') &&
                    includeNonItalic)),
    );

    const m = msg.IsDescending ? -1 : 1;

    const sortedFonts = filteredFonts.sort((a, b) => {
        // Sort by italic/non-italic first
        const aIsItalic = a.fontName.style.toLowerCase().includes('italic');
        const bIsItalic = b.fontName.style.toLowerCase().includes('italic');
        if (aIsItalic !== bIsItalic) {
            return m * ((aIsItalic ? 1 : 0) - (bIsItalic ? 1 : 0));
        }
        // Sort by weight order
        const aWeightIdx = fontWeightOrder.indexOf(
            a.fontName.style.toLowerCase().replace(/italic/i, '').trim(),
        );
        const bWeightIdx = fontWeightOrder.indexOf(
            b.fontName.style.toLowerCase().replace(/italic/i, '').trim(),
        );
        return m * (aWeightIdx - bWeightIdx);
    });

    return sortedFonts.map((font) => font.fontName);
}

/**
 * Creates the Figma frame containing the text waterfall
 * @param Plugin message
 * @returns Returns when text is created
 */
async function createStyledText(msg: PluginMessage): Promise<void> {
    const fonts = await createFontList(msg);
    await loadFonts(fonts);

    // Create a new frame to hold the styled text nodes
    const frame = figma.createFrame();

    frame.name = msg.frameName;
    frame.layoutMode = 'VERTICAL';
    frame.itemSpacing = defaultPad;
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
    frame.paddingLeft = defaultPad;
    frame.paddingRight = defaultPad;
    frame.paddingTop = defaultPad;
    frame.paddingBottom = defaultPad;

    let yOffset = 0;

    for (const case_ of msg.textCases) {
        for (const font of fonts) {
            const textNode = figma.createText();
            // Set the font before using the text node to ensure default font is not used
            textNode.fontName = font;
            textNode.characters = msg.textContent;
            textNode.fontSize = msg.fontSize;
            textNode.textCase = case_;
            textNode.y = yOffset;

            frame.appendChild(textNode);

            yOffset += msg.fontSize + defaultPad;
        }
    }

    figma.currentPage.appendChild(frame);
}

// Run the function and close the plugin
figma.ui.onmessage = async (msg: PluginMessage) => {
    if (msg.type === 'create-waterfall') {
        await createStyledText(msg);
    }
    figma.closePlugin();
};
