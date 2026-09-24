/** Strips HTML tags to produce plain text for search indexing and AI context. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(plainText: string): number {
  if (!plainText.trim()) return 0;
  return plainText.trim().split(/\s+/).length;
}

export function estimateReadingTimeMinutes(wordCount: number): number {
  const WORDS_PER_MINUTE = 200;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
