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
const regularFontWeightIdx = 8;

// List of common font widths ordered from widest to narrowest
const fontWidthOrder = [
    'wide',
    'semiwide',
    'narrow',
    'condensed',
    'compressed',
];
const regularFontWidthIdx = 1.5;

// Event message from the plugin UI
type PluginMessage = {
    type: string;
    frameName: string;
    textContent: string;
    fontSize: number;
    fontFamily: string;
    textStyles: string[];
    textCases: TextCase[];
    isDescending: boolean;
};

// Font object that expands on Font to include parsed style information
type FontParsed = {
    fontName: FontName;
    family: string;
    style: string;
    weight: string;
    weightIdx: number;
    width: string;
    widthIdx: number;
    isItalic: boolean;
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
 * Checks a string to see if it contains any one of a list of substrings
 * @param String to search
 * @param List of substrings to match on
 * @returns Matched substring and its index in the substring list or `regular` if not found
 */
function findMatchingSubstring(
    str: string,
    substrings: string[],
    regularIdx: number,
): [string, number] {
    for (let idx = 0; idx < substrings.length; idx++) {
        if (str.includes(substrings[idx])) {
            return [substrings[idx], idx];
        }
    }
    return ['regular', regularIdx];
}

/**
 * Parse a font into structured data with width, weight and italic information
 * @param Font name
 * @returns Font parsed
 */
async function parseFontName(font: Font): Promise<FontParsed> {
    const style = font.fontName.style.toLowerCase();
    const [weight, weightIdx] = findMatchingSubstring(
        style,
        fontWeightOrder,
        regularFontWeightIdx,
    );
    const [width, widthIdx] = findMatchingSubstring(
        style,
        fontWidthOrder,
        regularFontWidthIdx,
    );
    return {
        fontName: font.fontName,
        family: font.fontName.family,
        style: style,
        weight: weight,
        weightIdx: weightIdx,
        width: width,
        widthIdx: widthIdx,
        isItalic: style.includes('italic'),
    };
}

/**
 * Creates a list of fonts required for the waterfall, ordered by font weight
 * @param Plugin message
 * @returns Returns font names once the fonts are fetched and ordered
 */
async function createFontList(msg: PluginMessage): Promise<FontName[]> {
    const availableFonts = await figma.listAvailableFontsAsync();
    const availableFontsParsed = await Promise.all(
        availableFonts.map(parseFontName),
    );

    const includeItalic = msg.textStyles.indexOf('italic') !== -1;
    const includeNonItalic = msg.textStyles.indexOf('non-italic') !== -1;
    const m = msg.isDescending ? -1 : 1;

    const filteredFonts = availableFontsParsed.filter(
        (font) =>
            font.family === msg.fontFamily &&
            ((font.isItalic && includeItalic) || (!font.isItalic && includeNonItalic)),
    );

    const sortedFonts = filteredFonts.sort((a, b) => {
        // Sort by italic/non-italic first
        if (a.isItalic !== b.isItalic) {
            return m * ((a.isItalic ? 1 : 0) - (b.isItalic ? 1 : 0));
        }
        // Sort by width order

        // Sort by weight order
        return m * (a.weightIdx - b.weightIdx);
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
