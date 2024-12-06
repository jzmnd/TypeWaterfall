type PluginMessage = {
    type: string;
    frameName: string;
    textContent: string;
    yOffset: number;
    fontSize: number;
    fontFamily: string;
    textCases: TextCase[];
};

const defaultFrameWidth = 400;

// This shows the HTML page in "ui.html"
figma.showUI(__html__, { height: 420, width: 350, themeColors: true });

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

async function createFontList(fontFamily: string): Promise<FontName[]> {
    const availableFonts = await figma.listAvailableFontsAsync();
    const fonts: FontName[] = [];
    availableFonts
        .filter((font) => font.fontName.family === fontFamily)
        .map((font) => font.fontName.style)
        .forEach((s) => {
            fonts.push({ family: fontFamily, style: s });
        });
    return fonts;
}

async function createStyledText(msg: PluginMessage): Promise<void> {
    const fonts = await createFontList(msg.fontFamily);
    await loadFonts(fonts);
    const cases = msg.textCases;

    // Create a new frame to hold the styled text nodes
    const frame = figma.createFrame();
    // Calculate frame height from yOffset
    const frameHeight = msg.yOffset * (fonts.length + 1) * cases.length;
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
            yOffsetCur += msg.yOffset;
        }
        // Update the yOffsetCur for the next block of text
        yOffsetCur += msg.yOffset;
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
