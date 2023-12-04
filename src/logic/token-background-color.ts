import { createCanvas, loadImage } from "canvas";
import { getAllTokens } from "../utils/hive-engine.utils";
const DEFAULT_COLOR = "#0000002b";
let colorMap = {};

const getColorMap = () => colorMap;

const initFetchColorMap = () => {
  createColorMap();
  setInterval(() => {
    createColorMap();
  }, 3600 * 1000 * 12);
};

const createColorMap = async () => {
  const tokens = await getAllTokens();
  let map = {};
  for (const token of tokens) {
    map[token.symbol] = token.metadata.icon
      ? await getBackgroundColorFromImage(token.metadata.icon)
      : DEFAULT_COLOR;
  }
  console.log("new map generated!");
  colorMap = map;
};

const getBackgroundColorFromImage = async (imgLink: string) => {
  try {
    const canvas = createCanvas(200, 200);
    var context = canvas.getContext("2d");
    if (!context) return DEFAULT_COLOR;
    const img = await loadImage(imgLink);
    canvas.width = img.width;
    canvas.height = img.height;
    context?.drawImage(img, 0, 0, img.width, img.height);

    // Get the image data
    try {
      var imageData = context.getImageData(0, 0, img.width, img.height);
    } catch (err) {
      return "#0000002b";
    }
    var data = imageData.data;

    // Initialize variables
    var colorFrequency: any = {};
    var dominantColor = "";
    var maxFrequency = 0;

    // Loop through the image data
    for (var j = 0; j < data.length; j += 4) {
      var red = data[j];
      var green = data[j + 1];
      var blue = data[j + 2];

      if (red >= 200 && green >= 200 && blue >= 200) continue;

      // Convert the RGB values to a hex code
      var color = rgbToHex(red, green, blue);
      if (color === "#ffffff" || color === "#000000") continue;
      // Check if the color is already in the colorFrequency object
      if (colorFrequency[color]) {
        colorFrequency[color]++;
      } else {
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

    return `${dominantColor}2b`;
  } catch (e) {
    return DEFAULT_COLOR;
  }
};

const componentToHex = (c: any) => {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
};

const rgbToHex = (r: any, g: any, b: any) => {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

export const TokensBackgroundColorsLogic = {
  getColorMap,
  createColorMap,
  initFetchColorMap,
};
