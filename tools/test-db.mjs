import { readFile, readdir } from "node:fs/promises";
import { pool, setup } from "./db-test-lib.mjs";
{
  try {
    await setup();
    let checks = 0;
    const filters = process.argv.slice(2);
    for (const file of (await readdir("tests/postgres"))
      .filter(
        (f) =>
          f.endsWith(".sql") &&
          f !== "bootstrap.sql" &&
          (!filters.length || filters.some((x) => f.startsWith(x))),
      )
      .sort()) {
      await pool.query(await readFile("tests/postgres/" + file, "utf8"));
      console.log("PASS " + file);
      checks++;
    }
    if (!filters.length || filters.includes("quotes")) {
      const { runQuoteConcurrency } = await import(
        "../tests/postgres/quote-concurrency.mjs"
      );
      await runQuoteConcurrency();
      console.log("PASS concurrent quote throttle");
    }
    if (!filters.length || filters.includes("orders")) {
      const { runConcurrency } = await import(
        "../tests/postgres/order-concurrency.mjs"
      );
      await runConcurrency();
      console.log("PASS concurrent orders/recovery");
    }
    if (!filters.length || filters.includes("staff")) {
      const { runStaffConcurrency } = await import(
        "../tests/postgres/staff-concurrency.mjs"
      );
      await runStaffConcurrency();
      console.log("PASS concurrent staff/payment");
    }
    console.log(
      `Postgres ${checks} suites passed (real database, synthetic Auth).`,
    );
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
