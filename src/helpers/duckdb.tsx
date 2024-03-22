import * as duckdb from "@duckdb/duckdb-wasm";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

export default async function duckdb_init(
  minx: number,
  maxx: number,
  miny: number,
  maxy: number
) {
  const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: duckdb_wasm,
      mainWorker: mvp_worker,
    },
    eh: {
      mainModule: duckdb_wasm_eh,
      mainWorker: eh_worker,
    },
  };
  // Select a bundle based on browser checks
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
  // Instantiate the asynchronus version of DuckDB-wasm
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  const conn = await db.connect();
  const res = await conn.query(
    // Prepare query
    //`SELECT count(*)::INTEGER as v FROM read_parquet('https://object-arbutus.cloud.computecanada.ca/arbres/parquet/arbres_publics_mtl.parquet')  t(v);`
    `SELECT count(*)::INTEGER as v FROM read_parquet('https://ecoconnect.net/arbres_publics_mtl.parquet') t(v) WHERE Latitude != '' AND Latitude>${miny} AND Latitude<${maxy} AND Longitude>${minx} AND Longitude<${maxx};`
    //`SELECT count(*)::INTEGER as v FROM generate_series(0, 100) t(v);`
  );

  const result = res.toArray().map((row: any) => row.toJSON());
  await conn.close();
  return result[0].v;
  /* const stmt = await conn.prepare(
    `SELECT count(*) FROM read_parquet('https://object-arbutus.cloud.computecanada.ca/arbres/parquet/arbres_publics_mtl.parquet')`
  );*/
}

/*export async function duckdb_query(conn: any) {
  const res =
}*/
