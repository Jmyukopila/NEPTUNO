// Puerto opencode de tools/hooks/protect-secrets.js: bloquea Edit/Write sobre archivos
// de secretos/credenciales. Hook real y tipado (ver tool.execute.before en
// node_modules/@opencode-ai/plugin/dist/index.d.ts); lanzar Error bloquea la llamada
// y el mensaje llega al modelo como motivo del fallo.
const PATTERNS = [
  /(^|[\\/])\.env(\.[\w.-]+)?$/i,       // .env, .env.local, .env.production
  /\.(pem|p12|pfx|jks|keystore)$/i,     // claves y keystores
  /(^|[\\/])id_(rsa|ed25519|ecdsa)(\.pub)?$/i,
  /(^|[\\/])(credentials|secrets?)\.(json|ya?ml|toml|properties)$/i,
  /(^|[\\/])\.netrc$/i,
  /(^|[\\/])\.npmrc$/i,
];

export const ProtectSecrets = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "edit" && input.tool !== "write") return;
      const file = output.args?.filePath || "";
      if (file && PATTERNS.some((re) => re.test(file))) {
        throw new Error(
          `BLOQUEADO por plugin NEPTUNO: "${file}" parece un archivo de secretos/credenciales. ` +
            "No se edita automáticamente. Si el usuario lo pidió explícitamente, que lo edite él o desactive el plugin en opencode.json."
        );
      }
    },
  };
};
