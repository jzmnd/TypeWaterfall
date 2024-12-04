const fonts: FontName[] = [
    { family: "REM", style: "Thin" },
    { family: "REM", style: "ExtraLight" },
    { family: "REM", style: "Light" },
    { family: "REM", style: "Regular" },
    { family: "REM", style: "Medium" },
    { family: "REM", style: "SemiBold" },
    { family: "REM", style: "Bold" },
    { family: "REM", style: "ExtraBold" },
    { family: "REM", style: "Black" }
];

const frameName: string = "Styled Text";
const frameWidth: number = 400;
const frameHeight: number = 400;
const textContent: string = "Hello, World!";
const yOffset: number = 40;
const fontSize: number = 24;

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
    frame.resize(frameWidth, frameHeight);
    frame.name = frameName;

    let yOffsetCur = 0;

    for (const font of fonts) {
        // Create a text node
        const textNode = figma.createText();
        // Set the font before using the text node to ensure default font is not used
        textNode.fontName = font;
        textNode.characters = textContent;
        textNode.fontSize = fontSize;
        textNode.y = yOffsetCur;

        // Append the text node to the frame
        frame.appendChild(textNode);

        // Update the yOffsetCur for the next line of text
        yOffsetCur += yOffset;
    }

    // Add the frame to the current page
    figma.currentPage.appendChild(frame);
}

// Run the function and close the plugin
createStyledText().then(() => figma.closePlugin());
