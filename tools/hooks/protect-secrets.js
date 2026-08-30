// Hook PreToolUse (Edit|Write): bloquea escrituras sobre archivos de secretos/credenciales.
// Recibe el JSON del evento por stdin; exit 2 = bloquear (el mensaje de stderr llega al modelo).
const PATTERNS = [
  /(^|[\\/])\.env(\.[\w.-]+)?$/i,       // .env, .env.local, .env.production
  /\.(pem|p12|pfx|jks|keystore)$/i,     // claves y keystores
  /(^|[\\/])id_(rsa|ed25519|ecdsa)(\.pub)?$/i,
  /(^|[\\/])(credentials|secrets?)\.(json|ya?ml|toml|properties)$/i,
  /(^|[\\/])\.netrc$/i,
  /(^|[\\/])\.npmrc$/i,
];

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  let file = '';
  try { file = JSON.parse(raw).tool_input?.file_path || ''; } catch { process.exit(0); }
  if (file && PATTERNS.some(re => re.test(file))) {
    process.stderr.write(
      `BLOQUEADO por hook NEPTUNO: "${file}" parece un archivo de secretos/credenciales. ` +
      'No se edita automáticamente. Si el usuario lo pidió explícitamente, que lo edite él o que desactive el hook en settings.json.'
    );
    process.exit(2);
  }
  process.exit(0);
});
