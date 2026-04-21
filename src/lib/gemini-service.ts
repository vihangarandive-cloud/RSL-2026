/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Match } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function calculateMatchStatsWithAI(match: Match) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Calculate detailed cricket stats (Strike Rate, Economy, NRR impact) for this match data: ${JSON.stringify(match)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            battingStats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  runs: { type: Type.NUMBER },
                  balls: { type: Type.NUMBER },
                  strikeRate: { type: Type.NUMBER },
                  fours: { type: Type.NUMBER },
                  sixes: { type: Type.NUMBER }
                }
              }
            },
            bowlingStats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  overs: { type: Type.NUMBER },
                  runs: { type: Type.NUMBER },
                  wickets: { type: Type.NUMBER },
                  economy: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
  } catch (error) {
    console.error("AI Stat Error:", error);
    return null;
  }
}
