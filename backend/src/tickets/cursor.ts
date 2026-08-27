export function encodeCursor(id: string): string {
  return Buffer.from(id, "utf8").toString("base64");
}

export function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, "base64").toString("utf8");
  } catch {
    throw new Error("INVALID_CURSOR");
  }
}