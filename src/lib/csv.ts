/**
 * CSV serialisation and streaming, for the dashboard's export endpoints.
 *
 * Framework-free (no `next/server`): a `ReadableStream` and a `Response` are
 * platform types, so the route handlers stay thin controllers that choose the
 * columns and hand the rows here.
 */

/** RFC 4180 line ending — the one Excel is happiest with. */
const CRLF = "\r\n";

/**
 * A cell that begins with one of these is interpreted as a *formula* by Excel,
 * Sheets and Numbers when the file is opened. That turns a customer name of
 * `=cmd|…` into something the spreadsheet will offer to execute — CSV injection.
 */
const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/**
 * A value the export can carry. `null`/`undefined` become an empty cell rather
 * than the strings "null"/"undefined", which is what a spreadsheet reader expects
 * of a blank.
 */
export type CsvValue = string | number | boolean | Date | null | undefined;

/**
 * Escape one value into a CSV field.
 *
 * Everything is quoted rather than only the values that need it. Conditional
 * quoting is where CSV writers go wrong — the condition has to know about commas,
 * quotes, newlines *and* leading whitespace — and quoting unconditionally costs two
 * bytes a cell and is never ambiguous.
 *
 * Leading formula characters are neutralised with a `'` prefix, the escape
 * spreadsheets understand as "this is text". The alternative, stripping them,
 * would corrupt legitimate data (a note of `-5 units`).
 */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '""';

  const raw = value instanceof Date ? value.toISOString() : String(value);
  const guarded = FORMULA_PREFIXES.some((prefix) => raw.startsWith(prefix)) ? `'${raw}` : raw;

  return `"${guarded.replace(/"/g, '""')}"`;
}

/** Serialise one row, terminator included. */
export function csvRow(cells: readonly CsvValue[]): string {
  return cells.map(csvCell).join(",") + CRLF;
}

/**
 * Stream `rows` as a CSV body, header first.
 *
 * Streamed rather than assembled into a string because the whole reason an export
 * exists is that the data is too big for a screen — and buffering the entire file
 * server-side to send it in one piece puts a table of unknown size into memory, on
 * an endpoint anyone with the dashboard open can call repeatedly. Pulling from the
 * async iterable means memory stays proportional to one page of rows, and the
 * download starts immediately instead of after the last query.
 *
 * The source is an `AsyncIterable`, so back-pressure works end to end: the stream
 * only asks for the next chunk when the client has taken the previous one, and a
 * cancelled download stops the queries behind it rather than running to completion
 * into a socket nobody is reading.
 */
export function csvStream(
  header: readonly string[],
  rows: AsyncIterable<readonly CsvValue[]>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let iterator: AsyncIterator<readonly CsvValue[]> | undefined;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      // A UTF-8 BOM. Excel on Windows reads a BOM-less CSV as the system code page
      // and mangles every non-ASCII character in it — which for this app means
      // every Persian name in the customers export.
      controller.enqueue(encoder.encode("﻿" + csvRow(header)));
      iterator = rows[Symbol.asyncIterator]();
    },

    async pull(controller) {
      try {
        const next = await iterator!.next();
        if (next.done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(csvRow(next.value)));
      } catch (error) {
        // The status line is long gone — a 200 and the header row are already on
        // the wire — so there is no way to turn this into an error response. The
        // stream is aborted instead, which surfaces to the browser as a failed
        // download rather than as a silently truncated file the admin would trust.
        controller.error(error);
      }
    },

    async cancel(reason) {
      // The admin closed the tab or hit stop. Tell the generator, so it stops
      // paging the database for a file nobody is receiving.
      await iterator?.return?.(reason);
    },
  });
}

/**
 * Wrap a CSV stream in the response that makes a browser download it.
 *
 * `no-store` because the file is a snapshot of live, admin-only data: a proxy
 * holding one would serve yesterday's orders to whoever asks next.
 */
export function csvResponse(filename: string, body: ReadableStream<Uint8Array>): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

/**
 * Name an export after what it contains and when it was taken — `orders-2026-07-22.csv`.
 * An export is a snapshot, and a folder of files all called `orders.csv (3)` is one
 * nobody can reason about later.
 */
export function csvFilename(resource: string, at: Date = new Date()): string {
  return `${resource}-${at.toISOString().slice(0, 10)}.csv`;
}
