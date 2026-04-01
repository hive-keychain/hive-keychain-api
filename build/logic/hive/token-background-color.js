"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensBackgroundColorsLogic = void 0;
const canvas_1 = require("canvas");
const fs = __importStar(require("fs"));
const hive_engine_utils_1 = require("../../utils/hive-engine.utils");
const DEFAULT_COLOR = "#000000";
const getColorMap = async () => await fs
    .readFileSync(__dirname + `/../../../json/tokensBackgroundColors.json`)
    .toString();
const initFetchColorMap = () => {
    createColorMap();
    setInterval(() => {
        createColorMap();
    }, 3600 * 1000 * 12);
};
const createColorMap = async () => {
    const tokens = await (0, hive_engine_utils_1.getAllTokens)();
    if (!tokens)
        return;
    let map = {};
    for (const token of tokens) {
        map[token.symbol] = token.metadata.icon
            ? await getBackgroundColorFromImage(token.metadata.icon)
            : DEFAULT_COLOR;
    }
    console.log("new map generated!");
    try {
        await fs.writeFile(__dirname + `/../../../json/tokensBackgroundColors.json`, JSON.stringify(map), "utf8", () => console.log(`Updated color map`));
    }
    catch (e) {
        console.log("Failed to update color map");
    }
};
const getBackgroundColorFromImage = async (imgLink) => {
    if (!imgLink)
        return DEFAULT_COLOR;
    try {
        const canvas = (0, canvas_1.createCanvas)(200, 200);
        var context = canvas.getContext("2d");
        if (!context)
            return DEFAULT_COLOR;
        const img = await (0, canvas_1.loadImage)(imgLink);
        canvas.width = img.width;
        canvas.height = img.height;
        context?.drawImage(img, 0, 0, img.width, img.height);
        // Get the image data
        try {
            var imageData = context.getImageData(0, 0, img.width, img.height);
        }
        catch (err) {
            return DEFAULT_COLOR;
        }
        var data = imageData.data;
        // Initialize variables
        var colorFrequency = {};
        var dominantColor = "";
        var maxFrequency = 0;
        // Loop through the image data
        for (var j = 0; j < data.length; j += 4) {
            var red = data[j];
            var green = data[j + 1];
            var blue = data[j + 2];
            if (red >= 200 && green >= 200 && blue >= 200)
                continue;
            // Convert the RGB values to a hex code
            var color = rgbToHex(red, green, blue);
            if (color === "#ffffff" || color === "#000000")
                continue;
            // Check if the color is already in the colorFrequency object
            if (colorFrequency[color]) {
                colorFrequency[color]++;
            }
            else {
                colorFrequency[color] = 1;
            }
        }
        // Get the dominant color from the color frequency object
        for (var color in colorFrequency) {
            if (colorFrequency[color] > maxFrequency) {
                maxFrequency = colorFrequency[color];
                dominantColor = color;
            }
        }
        return dominantColor;
    }
    catch (e) {
        return DEFAULT_COLOR;
    }
};
const componentToHex = (c) => {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};
const rgbToHex = (r, g, b) => {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};
exports.TokensBackgroundColorsLogic = {
    getColorMap,
    createColorMap,
    initFetchColorMap,
    getBackgroundColorFromImage,
};
//# sourceMappingURL=token-background-color.js.map