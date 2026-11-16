/** Regresiones del ingreso y de la tarjeta editable, sin escribir datos personales. */
import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import crypto from "node:crypto";
import { transformWithEsbuild } from "vite";

async function load(relative, dependencies) {
  const filename = new URL(relative, import.meta.url);
  const { code } = await transformWithEsbuild(
    await readFile(filename, "utf8"),
    filename.pathname,
    {
      loader: "jsx",
      jsx: "automatic",
      format: "cjs",
    },
  );
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    Buffer,
    URL,
    console,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (!(name in dependencies))
        throw new Error("Dependencia inesperada: " + name);
      return dependencies[name];
    },
  });
  return module.exports;
}

function hooks() {
  const state = [];
  let cursor = 0;
  return {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in state))
          state[index] = typeof initial === "function" ? initial() : initial;
        return [
          state[index],
          (next) => {
            state[index] =
              typeof next === "function" ? next(state[index]) : next;
          },
        ];
      },
      createContext: () => ({ Provider: "Provider" }),
      useCallback: (callback) => callback,
      useMemo: (factory) => factory(),
      useEffect() {},
    },
    render(component) {
      cursor = 0;
      return component();
    },
  };
}

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...nodes(tree.props?.children)];
}

async function profileEditor(updateProfile) {
  const hook = hooks();
  let user = {
    username: "alumno",
    displayName: "Alumno",
    email: "alumno@example.test",
  };
  const validators = await import("../src/utils/validators.js");
  const { useForm } = await load("../src/hooks/useForm.js", {
    react: hook.react,
    "../utils/validators.js": validators,
  });
  const { ProfileDetailsForm } = await load(
    "../src/components/profile/ProfileDetailsForm.jsx",
    {
      react: hook.react,
      "lucide-react": {
        Pencil: "Pencil",
        Save: "Save",
        UserRound: "UserRound",
      },
      "../../hooks/useAuth.js": {
        useAuth: () => ({
          user,
          updateAuthenticatedUser: (next) => {
            user = next;
          },
        }),
      },
      "../../hooks/useForm.js": { useForm },
      "../../services/userService.js": { updateProfile },
      "../../utils/validators.js": validators,
      "../Button.jsx": { Button: "Button" },
      "../FormStatus.jsx": { FormStatus: "FormStatus" },
      "../TextField.jsx": { TextField: "TextField" },
      "../Alert.jsx": { Alert: "Alert" },
    },
  );
  return {
    render: () => hook.render(ProfileDetailsForm),
    user: () => user,
  };
}

test("Editar y Cancelar descartan el borrador sin llamar a la API", async () => {
  let writes = 0;
  const editor = await profileEditor(async () => {
    writes++;
  });
  nodes(editor.render())
    .find((node) => node.type === "Button")
    .props.onClick();
  nodes(editor.render())
    .find((node) => node.props.label === "Nombre visible")
    .props.onChange({ target: { value: "Borrador" } });
  nodes(editor.render())
    .find((node) => node.props.children === "Cancelar")
    .props.onClick();
  assert.equal(editor.user().displayName, "Alumno");
  assert.equal(writes, 0);
  assert.equal(editor.render().type, "section");
});

test("Guardar espera confirmación de la API y actualiza la tarjeta", async () => {
  const editor = await profileEditor(async (values) => ({
    user: { ...values, email: "alumno@example.test" },
  }));
  nodes(editor.render())
    .find((node) => node.type === "Button")
    .props.onClick();
  nodes(editor.render())
    .find((node) => node.props.label === "Nombre visible")
    .props.onChange({ target: { value: "Nombre guardado" } });
  await editor.render().props.onSubmit({ preventDefault() {} });
  assert.equal(editor.user().displayName, "Nombre guardado");
  assert.equal(editor.render().type, "section");
  assert.ok(nodes(editor.render()).some((node) => node.type === "Alert"));
});

test("Un guardado fallido conserva el formulario y el perfil confirmado", async () => {
  const editor = await profileEditor(async () => {
    throw new Error("Sin conexión");
  });
  nodes(editor.render())
    .find((node) => node.type === "Button")
    .props.onClick();
  await editor.render().props.onSubmit({ preventDefault() {} });
  assert.equal(editor.user().displayName, "Alumno");
  const form = editor.render();
  assert.equal(form.type, "form");
  assert.equal(
    nodes(form).find((node) => node.type === "FormStatus").props.form.status
      .type,
    "error",
  );
});

for (const role of ["user", "admin"]) {
  test(
    "El ingreso local de " + role + " abre bienvenida antes del perfil",
    async () => {
      const hook = hooks();
      const destinations = [];
      const { AuthProvider } = await load("../src/context/AuthContext.jsx", {
        react: hook.react,
        "react-router-dom": {
          useNavigate: () => (destination) => destinations.push(destination),
        },
        "../services/apiClient.js": { clearCsrfToken() {}, setCsrfToken() {} },
        "../services/authService.js": {
          loginUser: async () => ({
            user: { username: "alumno", role },
            csrfToken: "test",
          }),
        },
      });
      const provider = hook.render(() => AuthProvider({ children: null }));
      await provider.props.value.login({
        identifier: "alumno",
        password: "Prueba123",
      });
      assert.deepEqual(destinations, ["/bienvenida"]);
    },
  );
}

test("El callback social completa la sesión y vuelve a bienvenida con los tres proveedores", async () => {
  const events = [];
  const provider = { id: "google", isConfigured: true };
  const user = {
    id: 1,
    isActive: true,
    emailVerifiedAt: "2026-11-16",
    email: "alumno@example.test",
  };
  const { oauthCallback } = await load(
    "../../backend/controllers/oauthController.js",
    {
      "node:crypto": crypto,
      "../config/env.js": {
        env: { clientOrigins: ["http://localhost:5173"], cookieSecure: false },
      },
      "../config/oauthProviders.js": { getOAuthProvider: () => provider },
      "../config/db.js": {
        withTransaction: async (operation) =>
          operation({ lockIdentity: async () => {} }),
      },
      "../models/auditLogModel.js": { writeAuditLog: async () => {} },
      "../models/oauthAccountModel.js": {
        findOAuthAccount: async () => ({ userId: 1 }),
      },
      "../models/oauthStateModel.js": {
        consumeOAuthState: async () => ({ codeVerifier: "test" }),
      },
      "../models/userModel.js": { findPublicUserById: async () => user },
      "./authController.js": {
        issueNewSession: async () => {
          events.push("session");
          return {};
        },
        setAuthCookies: () => events.push("cookies"),
      },
      "../services/oauthService.js": {
        oauthStateCookieName: () => "test-state",
        oauthStateCookieOptions: () => ({}),
        exchangeCodeForTokens: async () => ({}),
        fetchNormalizedProfile: async () => ({
          providerUserId: "external-id",
          email: user.email,
        }),
      },
      "../services/tokenService.js": { hashToken: () => "hash" },
      "../utils/errors.js": { AppError: Error },
      "../utils/oauthErrors.js": { classifyOAuthError: () => "provider" },
    },
  );
  for (const name of ["google", "github", "discord"]) {
    provider.id = name;
    let destination;
    await oauthCallback(
      {
        params: { provider: name },
        query: { state: "valid", code: "test-code" },
        cookies: { "test-state": "valid" },
      },
      {
        clearCookie() {},
        redirect(status, url) {
          assert.equal(status, 303);
          destination = url;
        },
      },
    );
    assert.equal(destination, "http://localhost:5173/bienvenida?oauth=" + name);
  }
  assert.deepEqual(events, [
    "session",
    "cookies",
    "session",
    "cookies",
    "session",
    "cookies",
  ]);
});
