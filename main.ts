// One Line of Earned Pride — make.fun bounty
// u-mang-one-line-of-earned-pride-a0138557
//
// The program writes exactly one line of text to entry.txt inside the
// output directory (MAKEFUN_OUTPUT_DIR, default /output). The line is a
// quiet, earned moment of pride: a small person doing something hard,
// a long effort finally landing, told as one concrete scene that lands
// in a single read. Nothing is read from the network, the environment
// (beyond the output directory), or any file outside this repository;
// the entry is fully contained in this source file.
//
// The sealed scorer's gate, as published in the competition rules:
//   - /output/entry.txt is UTF-8 text
//   - 1 to 240 characters (characters, not bytes)
//   - not only white space
// This program validates the line against that gate before writing it,
// and re-reads the written file to prove the bytes on disk are exactly
// the validated line. Two runs therefore always produce the same file.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// The entry
// ---------------------------------------------------------------------------
//
// Lena spent a whole summer clinging to the pool's edge — the effort is
// the season of fear, not a trophy. She lets go, swims the length alone,
// and surfaces to her father standing at the deep end with both hands
// over his mouth: the pride is earned inside the line, shown by what
// happened, never asserted or congratulated. One scene, one read, no
// stock podium, medal, or graduation in sight.
//
// 173 characters, one line, plain UTF-8.
const ENTRY =
  "After a summer of clinging to the pool's edge, Lena let go, swam the whole length alone, and surfaced to find her father standing at the deep end, both hands over his mouth.";

// ---------------------------------------------------------------------------
// Gate constants — mirror the published scorer gate exactly.
// ---------------------------------------------------------------------------

const MIN_CHARS = 1;
const MAX_CHARS = 240;
const OUTPUT_FILENAME = "entry.txt";
const DEFAULT_OUTPUT_DIR = "/output";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Count characters the way the gate does: Unicode code points, not
 * UTF-16 code units and not bytes. A character outside the BMP (an
 * emoji, for example) is one character here, even though it is two
 * UTF-16 units and up to four UTF-8 bytes.
 */
function countCharacters(text: string): number {
  return [...text].length;
}

/**
 * True when the text holds at least one character that is not white
 * space, so a line of spaces or tabs alone can never pass the gate.
 */
function hasVisibleContent(text: string): boolean {
  return text.trim().length > 0;
}

/**
 * True when the text is a single line: no line feed, no carriage
 * return, no other Unicode line separator hiding inside it.
 */
function isSingleLine(text: string): boolean {
  return !/[\n\r\u2028\u2029]/.test(text);
}

/**
 * True when the line starts and ends with a visible character. A
 * leading or trailing space would be invisible padding around the
 * moment and could be trimmed away by a reader, changing the line
 * the judge actually sees.
 */
function hasNoEdgeWhitespace(text: string): boolean {
  return text.length > 0 && text[0] !== " " && text[text.length - 1] !== " ";
}

/**
 * True when no character is a control character (C0, DEL, or C1),
 * which would break a one-line read of the file.
 */
function hasNoControlCharacters(text: string): boolean {
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) {
      return false;
    }
  }
  return true;
}

/**
 * Round-trip the text through UTF-8. Anything that is not valid,
 * encodable UTF-8 text (lone surrogates, for instance) fails here
 * instead of silently reaching the file.
 */
function isValidUtf8(text: string): boolean {
  const roundTripped = new TextDecoder("utf-8", { fatal: true }).decode(
    new TextEncoder().encode(text),
  );
  return roundTripped === text;
}

/**
 * Validate one entry line against every part of the published gate.
 * Throws a descriptive Error naming the exact failing rule, so a
 * broken line is caught here, in this process, and never written.
 */
function validateEntry(text: string): void {
  if (typeof text !== "string") {
    throw new Error("entry must be a string");
  }

  const chars = countCharacters(text);
  if (chars < MIN_CHARS || chars > MAX_CHARS) {
    throw new Error(
      `entry must be ${MIN_CHARS} to ${MAX_CHARS} characters, got ${chars}`,
    );
  }

  if (!hasVisibleContent(text)) {
    throw new Error("entry must not be only white space");
  }

  if (!isSingleLine(text)) {
    throw new Error("entry must be a single line");
  }

  if (!hasNoEdgeWhitespace(text)) {
    throw new Error("entry must not start or end with a space");
  }

  if (!hasNoControlCharacters(text)) {
    throw new Error("entry must not contain control characters");
  }

  if (!isValidUtf8(text)) {
    throw new Error("entry must be valid UTF-8 text");
  }
}

/**
 * Resolve the output directory. MAKEFUN_OUTPUT_DIR is the only
 * environment input the program takes; anything else is ignored.
 * An empty value falls back to the default so the grader's
 * /output is used when the variable is set but blank.
 */
function resolveOutputDir(): string {
  const configured = process.env.MAKEFUN_OUTPUT_DIR;
  if (configured !== undefined && configured.trim() !== "") {
    return configured;
  }
  return DEFAULT_OUTPUT_DIR;
}

/**
 * Write the validated line to entry.txt and read it back, proving the
 * bytes on disk are exactly the line that passed the gate. No trailing
 * newline is added: the file holds the line and nothing else, so the
 * character count on disk matches the validated count exactly.
 */
function writeEntry(outputDir: string, text: string): string {
  mkdirSync(outputDir, { recursive: true });
  const filePath = join(outputDir, OUTPUT_FILENAME);
  writeFileSync(filePath, text, "utf8");

  const written = readFileSync(filePath, "utf8");
  if (written !== text) {
    throw new Error(
      `read-back mismatch: ${filePath} does not hold the validated entry`,
    );
  }
  return filePath;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  validateEntry(ENTRY);
  const outputDir = resolveOutputDir();
  const filePath = writeEntry(outputDir, ENTRY);
  console.log(
    `wrote ${countCharacters(ENTRY)}-character entry to ${filePath}`,
  );
}

main();
