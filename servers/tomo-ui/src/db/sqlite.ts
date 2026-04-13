import initSqlite, { type Database as SqliteDatabase, type PreparedStatement } from "@sqlite.org/sqlite-wasm";
import { readFile, writeFile } from "node:fs/promises";

import { fileExists } from "../shared/utils.js";

type Binding =
  | readonly unknown[]
  | Record<string, unknown>
  | string
  | number
  | boolean
  | bigint
  | Uint8Array
  | null
  | undefined;

type SqliteModule = Awaited<ReturnType<typeof initSqlite>>;

let sqlite_promise: Promise<SqliteModule> | undefined;

const get_sqlite = async () => {
  sqlite_promise ??= initSqlite();
  return sqlite_promise;
};

export class SqliteWasmDatabase {
  private constructor(
    private readonly sqlite3: SqliteModule,
    private readonly database: SqliteDatabase,
    readonly file_path?: string
  ) {}

  static async open_from_bytes(bytes?: Uint8Array, file_path?: string) {
    const sqlite3 = await get_sqlite();
    const database = new sqlite3.oo1.DB(":memory:");

    if (bytes && bytes.byteLength > 0) {
      if (!database.pointer) {
        throw new Error("SQLite database pointer is unavailable during deserialize.");
      }

      const pointer = sqlite3.wasm.allocFromTypedArray(bytes);
      const result = sqlite3.capi.sqlite3_deserialize(
        database.pointer,
        "main",
        pointer,
        bytes.byteLength,
        bytes.byteLength,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
      );

      database.checkRc(result);
    }

    return new SqliteWasmDatabase(sqlite3, database, file_path);
  }

  static async open_from_file(file_path: string) {
    const raw = (await fileExists(file_path)) ? await readFile(file_path) : undefined;
    const bytes = raw ? new Uint8Array(raw) : undefined;
    return SqliteWasmDatabase.open_from_bytes(bytes, file_path);
  }

  exec(sql: string, bind?: Binding) {
    if (typeof bind === "undefined") {
      this.database.exec(sql);
      return this;
    }

    this.database.exec({ sql, bind: bind as never });
    return this;
  }

  prepare(sql: string) {
    return this.database.prepare(sql) as PreparedStatement;
  }

  run(sql: string, bind?: Binding) {
    const statement = this.prepare(sql);

    try {
      if (typeof bind !== "undefined") {
        statement.bind(bind as never);
      }

      statement.step();
    } finally {
      statement.finalize();
    }

    return this;
  }

  get<T>(sql: string, bind?: Binding) {
    return this.database.selectObject(sql, bind as never) as T | undefined;
  }

  all<T>(sql: string, bind?: Binding) {
    return this.database.selectObjects(sql, bind as never) as T[];
  }

  value<T>(sql: string, bind?: Binding) {
    return this.database.selectValue(sql, bind as never) as T | undefined;
  }

  export_bytes() {
    if (!this.database.pointer) {
      throw new Error("SQLite database pointer is unavailable during export.");
    }

    return this.sqlite3.capi.sqlite3_js_db_export(this.database.pointer);
  }

  async save(file_path = this.file_path) {
    if (!file_path) {
      return;
    }

    await writeFile(file_path, this.export_bytes());
  }

  async close(options?: { save?: boolean; file_path?: string }) {
    if (options?.save) {
      await this.save(options?.file_path);
    }

    this.database.close();
  }
}
