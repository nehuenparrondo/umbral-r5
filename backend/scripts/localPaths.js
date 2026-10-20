/** Rutas del proyecto independientes de la terminal actual. */
import { fileURLToPath } from "node:url";
import path from "node:path";
export const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
export const localRoot = path.join(projectRoot, ".local");
