import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENTRY =
  "After 412 mornings sweeping the pool hall before dawn for one free hour of practice, Mara finally ran the table tonight, chalk on her hands, grinning at no one.";

function validate(text: string): void {
  if (typeof text !== "string") throw new Error("entry must be a string");
  // Gate counts characters, not bytes: count code points via spread.
  const chars = [...text];
  if (chars.length < 1 || chars.length > 240) {
    throw new Error(`entry must be 1 to 240 characters, got ${chars.length}`);
  }
  if (text.trim().length === 0) throw new Error("entry must not be only whitespace");
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  // Reject control characters that would break the one-line read.
  for (const ch of chars) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) {
      throw new Error("entry must not contain control characters");
    }
  }
  // Round-trip check: the text must survive UTF-8 encoding unchanged.
  const roundTripped = new TextDecoder("utf-8", { fatal: true }).decode(
    new TextEncoder().encode(text),
  );
  if (roundTripped !== text) throw new Error("entry must be valid UTF-8 text");
}

function main(): void {
  validate(ENTRY);
  const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "entry.txt"), ENTRY, "utf8");
}

main();
