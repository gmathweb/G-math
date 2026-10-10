export interface TextPart {
  text: string;
  highlighted: boolean;
}

/** Splits `text` around matches of `pattern` (which must contain one capture group). */
export function splitHighlight(text: string, pattern: RegExp): TextPart[] {
  return text
    .split(pattern)
    .map((part, index) => ({ text: part, highlighted: index % 2 === 1 }))
    .filter(part => part.text !== '');
}
