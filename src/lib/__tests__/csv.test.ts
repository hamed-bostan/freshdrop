import { describe, expect, it } from "vitest";
import { parseCsv } from "../csv";

describe("parseCsv", () => {
  it("parses plain comma-separated rows", () => {
    expect(parseCsv("a,b,c\n1,2,3\n")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("unquotes a field containing a comma", () => {
    expect(parseCsv('a,"b,c",d\n')).toEqual([["a", "b,c", "d"]]);
  });

  it("unescapes a doubled quote inside a quoted field", () => {
    expect(parseCsv('a,"b""c",d\n')).toEqual([["a", 'b"c', "d"]]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps a newline embedded inside a quoted field as content, not a row break", () => {
    expect(parseCsv('a,"line1\nline2"\n')).toEqual([["a", "line1\nline2"]]);
  });

  it("flushes the last row when the file has no trailing newline", () => {
    expect(parseCsv("a,b")).toEqual([["a", "b"]]);
  });

  it("returns no rows for an empty file", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("strips a leading UTF-8 BOM", () => {
    expect(parseCsv("﻿a,b\n")).toEqual([["a", "b"]]);
  });

  it("does not invent a trailing empty row after the last row's own newline", () => {
    expect(parseCsv("a,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("still captures a genuinely blank line", () => {
    expect(parseCsv("a\n\n")).toEqual([["a"], [""]]);
  });
});
