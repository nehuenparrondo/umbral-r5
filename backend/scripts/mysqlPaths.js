/** Rutas del servidor MySQL local, aislado de XAMPP y de otros proyectos. */
import path from "node:path";
import { projectRoot, localRoot } from "./localPaths.js";
export { projectRoot, localRoot };
export const mysqlRoot = path.join(localRoot, "mysql");
export const mysqlData = path.join(localRoot, "mysql-data");
export const mysqlCredentialsPath = path.join(
  localRoot,
  "mysql-credentials.json",
);
export const mysqlPort = 3307;
