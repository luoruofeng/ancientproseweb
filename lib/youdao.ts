/**
 * Fetches the pronunciation of an English word from Youdao and saves it as an MP3 file.
 * @param content The English word to fetch.
 * @param type 1 for English pronunciation.
 * @returns The path to the saved MP3 file.
 */
export async function getEnglishWordVoice(content: string, type: 1 | 2 = 1): Promise<ArrayBuffer> {
  const url = `https://dict.youdao.com/dictvoice?audio=${content}&type=${type}`;

  try {
    console.log(`Downloading audio from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error downloading audio: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return buffer;
  } catch (error) {
    console.error(`Error downloading audio: ${error}`);
    throw error;
  }
}

export interface YoudaoTranslation {
  explain: string;
  entry: string;
}

/**
 * Translates an English word using Youdao's suggestion API.
 * @param word The English word to translate.
 * @returns A list of translation entries.
 */
export async function translateWord(word: string): Promise<YoudaoTranslation[]> {
  const url = `https://dict.youdao.com/suggest?q=${word}&le=zh&doctype=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching translation: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.result.code !== 200) {
      throw new Error(`Youdao API error: ${data.result.msg}`);
    }
    return data.data.entries;
  } catch (error) {
    console.error(`Error translating word: ${error}`);
    throw error;
  }
}