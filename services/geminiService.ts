import { GoogleGenAI, Modality } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";
import { Quality } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development. In a real environment, the key should be set.
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

interface ProcessResult {
  base64: string;
  mimeType: string;
}

const processImageWithPrompt = async (imageFile: File, promptText: string): Promise<ProcessResult> => {
   try {
    const base64Image = await fileToBase64(imageFile);
    const imagePart = {
      inlineData: {
        mimeType: imageFile.type,
        data: base64Image,
      },
    };

    const textPart = {
      text: promptText,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        };
      }
    }

    throw new Error("ИИ не вернул изображение. Пожалуйста, попробуйте еще раз.");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes("did not return an image")) {
        throw error;
    }
    throw new Error("Не удалось обработать изображение. Модель может быть перегружена или формат не поддерживается.");
  }
}

export const removeWatermark = async (imageFile: File, quality: Quality): Promise<ProcessResult> => {
    let promptText = "";

    switch (quality) {
      case 'low':
        promptText = `Quickly perform a basic removal of the most obvious watermark or logo on this image. The main goal is speed. A simple content-aware fill is acceptable. Minor artifacts or slight blurring in the restored area are okay.`;
        break;
      case 'high':
        promptText = `
          You are a world-class digital image restoration specialist. Your sole mission is to perform a perfect, undetectable removal of any and all watermarks, logos, text overlays, or graphical symbols from the provided image.

          Follow these steps with extreme precision:
          1.  **Detection**: Meticulously scan the entire image for any foreign elements. This includes, but is not limited to: corner logos, repeating semi-transparent patterns, signatures, timestamps, and text overlays. They can be any color, including pure white, pure black, or have varying levels of opacity.
          2.  **Removal**: Completely eradicate the detected elements. Leave no trace, residue, or color bleed.
          3.  **Inpainting & Reconstruction**: This is the most critical step. You must flawlessly reconstruct the area where the watermark was. The inpainted area must perfectly match the surrounding background in terms of texture, lighting, color, grain, and perspective. The goal is for the final image to appear as if the watermark never existed. There should be zero visual artifacts, blurring, or smudging. The reconstruction must be seamless and photo-realistic.
          4.  **Final Verification**: Ensure the final image has the same dimensions as the original and that the subject matter is unaltered, apart from the removal of the watermark.

          Your performance will be judged on the absolute invisibility of your edit. Prioritize maximum quality and realism above all else.`;
        break;
      case 'medium':
      default:
        promptText = `Your task is to identify and completely remove any watermarks or logos from this image. This includes text, symbols, or graphical overlays of any color, including white, black, or semi-transparent ones. After removing the element, you must seamlessly reconstruct the background behind it, ensuring the final image looks natural and shows no obvious signs of editing or major artifacts. Balance quality with reasonable processing time.`;
        break;
    }
    return processImageWithPrompt(imageFile, promptText);
};

export const removeBackground = async (imageFile: File): Promise<ProcessResult> => {
  const promptText = `
    You are a professional graphic editor AI with a single, precise task: to flawlessly remove the background from an image.

    Follow this exact procedure:
    1.  **Subject Identification**: Accurately identify the main subject(s) of the image. Distinguish it completely from the background.
    2.  **High-Precision Edge Detection**: Meticulously trace the outline of the subject(s). Pay extreme attention to fine details like hair, fur, semi-transparent edges, and complex shapes. The mask must be perfect.
    3.  **Background Removal**: Erase the background completely, leaving no artifacts, halos, or color bleeding around the subject.
    4.  **Output Format**: The final output MUST be a PNG image with a fully transparent background. This is a strict requirement. The subject should be the only opaque element.

    Do not alter the subject in any way (colors, lighting, etc.). The goal is a clean, professional-grade cutout.`;
  return processImageWithPrompt(imageFile, promptText);
};