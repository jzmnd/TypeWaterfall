const fontFamily: string = "REM";

const fonts: FontName[] = [
    { family: fontFamily, style: "Thin" },
    { family: fontFamily, style: "ExtraLight" },
    { family: fontFamily, style: "Light" },
    { family: fontFamily, style: "Regular" },
    { family: fontFamily, style: "Medium" },
    { family: fontFamily, style: "SemiBold" },
    { family: fontFamily, style: "Bold" },
    { family: fontFamily, style: "ExtraBold" },
    { family: fontFamily, style: "Black" }
];

const cases: TextCase[] = [
    "ORIGINAL",
    "SMALL_CAPS"
];

const frameName: string = "Styled Text";
const frameWidth: number = 400;
const textContent: string = "Hello, World!";
const yOffset: number = 20;
const fontSize: number = 16;

async function loadFonts(): Promise<void> {
    for (const font of fonts) {
        console.log("Loading font:", font.family, font.style);
        await figma.loadFontAsync(font);
    }
}

async function createStyledText(): Promise<void> {
    await loadFonts();

    // Create a new frame to hold the styled text nodes
    const frame = figma.createFrame();
    // Calculate frame height from yOffset
    let frameHeight = yOffset * (fonts.length + 1) * cases.length;
    frame.resize(frameWidth, frameHeight);
    frame.name = frameName;

    let yOffsetCur = 0;

    for (const case_ of cases) {
        for (const font of fonts) {
            // Create a text node
            const textNode = figma.createText();
            // Set the font before using the text node to ensure default font is not used
            textNode.fontName = font;
            textNode.characters = textContent;
            textNode.fontSize = fontSize;
            textNode.textCase = case_;
            textNode.y = yOffsetCur;

            // Append the text node to the frame
            frame.appendChild(textNode);

            // Update the yOffsetCur for the next line of text
            yOffsetCur += yOffset;
        }
        // Update the yOffsetCur for the next block of text
        yOffsetCur += yOffset;
    }

    // Add the frame to the current page
    figma.currentPage.appendChild(frame);
}

// Run the function and close the plugin
createStyledText().then(() => figma.closePlugin());
