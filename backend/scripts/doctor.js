/** Diagnóstico de MySQL sin imprimir credenciales ni datos de cuentas. */
try {
  const { checkDatabase, databaseHelp } =
    await import("../services/databaseHealth.js");
  const { pool } = await import("../config/db.js");
  try {
    await checkDatabase();
    const { rows } = await pool.query(
      "SELECT VERSION() AS version, CURRENT_USER() AS account",
    );
    const grants = await pool.query("SHOW GRANTS");
    const statements = grants.rows.flatMap((row) => Object.values(row));
    if (
      statements.some(
        (value) =>
          /GRANT (?!USAGE\b).+ ON \*\.\*/i.test(value) ||
          /WITH GRANT OPTION/i.test(value),
      )
    )
      throw new Error("Exceso de privilegios");
    console.log(
      `OK: MySQL ${rows[0].version}, tablas listas y cuenta SQL sin administración global.`,
    );
  } catch (error) {
    console.error(
      error.message === "Exceso de privilegios"
        ? "No usar root para ejecutar la API."
        : databaseHelp(error),
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
} catch {
  console.error(
    "Configurar backend/.env con mysql:// y ejecutar npm run doctor.",
  );
  process.exitCode = 1;
}
