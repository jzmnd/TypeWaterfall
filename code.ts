// List of the most common font weight names ordered from lowest to highest weight
const fontWeightOrder = [
    'Hairline',
    'Thin',
    'Ultra Light',
    'UltraLight',
    'Extra Light',
    'ExtraLight',
    'Light',
    'Normal',
    'Regular',
    '', // Include blank string to account for Regular Italic which is often just named Italic
    'Medium',
    'Semi Bold',
    'SemiBold',
    'Demi Bold',
    'DemiBold',
    'Bold',
    'Extra Bold',
    'ExtraBold',
    'Ultra Bold',
    'UltraBold',
    'Black',
    'Heavy',
];

type PluginMessage = {
    type: string;
    frameName: string;
    textContent: string;
    fontSize: number;
    fontFamily: string;
    textStyles: string[];
    textCases: TextCase[];
};

const defaultFrameWidth = 400;
const defaultPad = 5;

// This shows the HTML page in "ui.html"
figma.showUI(__html__, { height: 400, width: 350, themeColors: true });

(async () => {
    const availableFonts = await figma.listAvailableFontsAsync();

    // Extract unique font families and send to the UI
    const fontFamilies = [
        ...new Set(availableFonts.map((font) => font.fontName.family)),
    ];
    figma.ui.postMessage({ type: 'font-families', data: fontFamilies });
})();

async function loadFonts(fonts: FontName[]): Promise<void> {
    for (const font of fonts) {
        await figma.loadFontAsync(font);
    }
}

async function createFontList(msg: PluginMessage): Promise<FontName[]> {
    const availableFonts = await figma.listAvailableFontsAsync();

    const filteredFonts = availableFonts.filter(
        (font) => font.fontName.family === msg.fontFamily,
    );

    // Custom sorting function
    const sortedFonts = filteredFonts.sort((a, b) => {
        // Sort by italic/non-italic first
        const aIsItalic = a.fontName.style.toLowerCase().includes('italic');
        const bIsItalic = b.fontName.style.toLowerCase().includes('italic');
        if (aIsItalic !== bIsItalic) {
            return (aIsItalic ? 1 : 0) - (bIsItalic ? 1 : 0);
        }
        // Sort by weight order
        const aWeightIdx = fontWeightOrder.indexOf(
            a.fontName.style.replace(/italic/i, '').trim(),
        );
        const bWeightIdx = fontWeightOrder.indexOf(
            b.fontName.style.replace(/italic/i, '').trim(),
        );
        return aWeightIdx - bWeightIdx;
    });

    return sortedFonts.map((font) => font.fontName);
}

async function createStyledText(msg: PluginMessage): Promise<void> {
    const fonts = await createFontList(msg);
    await loadFonts(fonts);
    const cases = msg.textCases;

    // Create a new frame to hold the styled text nodes
    const frame = figma.createFrame();
    // Calculate frame height from yOffset
    const yOffset = msg.fontSize + defaultPad;
    const frameHeight = yOffset * fonts.length * cases.length;
    frame.resize(defaultFrameWidth, frameHeight);
    frame.name = msg.frameName;

    let yOffsetCur = 0;

    for (const case_ of cases) {
        for (const font of fonts) {
            // Create a text node
            const textNode = figma.createText();
            // Set the font before using the text node to ensure default font is not used
            textNode.fontName = font;
            textNode.characters = msg.textContent;
            textNode.fontSize = msg.fontSize;
            textNode.textCase = case_;
            textNode.y = yOffsetCur;

            // Append the text node to the frame
            frame.appendChild(textNode);

            // Update the yOffsetCur for the next line of text
            yOffsetCur += yOffset;
        }
    }

    // Add the frame to the current page
    figma.currentPage.appendChild(frame);
}

// Run the function and close the plugin
figma.ui.onmessage = async (msg: PluginMessage) => {
    if (msg.type === 'create-waterfall') {
        await createStyledText(msg);
    }
    figma.closePlugin();
};
