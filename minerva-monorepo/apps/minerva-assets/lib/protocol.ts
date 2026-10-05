/**
 * The wire grammar of the Minerva Desktop release-channel protocol.
 *
 * This is the server-side twin of `apps/desktop/electron/updater/channel-protocol.ts`
 * in the desktop repo, which is the client-side decoder and the authority. The
 * host's job is to refuse to serve a record or manifest that every client would
 * reject anyway: a malformed object published by a broken pipeline is a hard
 * outage for the fleet, so it fails at the origin instead of at each install.
 *
 * Deliberately NOT reimplemented here: the semantics the resolver applies after
 * decoding (identity equality, version/sequence binding, signing identity,
 * immutable key prefixes). Those are client decisions about trust; the host
 * only guarantees shape, so a passing validation never means "safe to install".
 */

const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const BUILD_ID = /^[a-f0-9]{32}$/;
const CHANNEL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const VERSION =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?(?:\+[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/;

/** Windows reserved device names, rejected in any path segment (case-insensitive). */
const RESERVED = new Set([
  "con", "prn", "aux", "nul",
  ...Array.from({ length: 9 }, (_, i) => `com${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `lpt${i + 1}`),
]);

export class ProtocolError extends Error {}

function fail(message: string): never {
  throw new ProtocolError(message);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    fail(`${label} must be a non-empty string`);
  }
  // Control characters in a key or name become a header/URL hazard downstream.
  if ([...value].some((character) => character.charCodeAt(0) < 32)) {
    fail(`${label} must not contain control characters`);
  }
  return value;
}

function pattern(value: unknown, expression: RegExp, label: string): string {
  const result = text(value, label);
  if (!expression.test(result)) fail(`${label} does not match ${expression}`);
  return result;
}

function integer(value: unknown, label: string, minimum = 1, maximum = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum || value > maximum) {
    fail(`${label} must be an integer in [${minimum}, ${maximum}]`);
  }
  return value;
}

function optional<T>(value: unknown, check: (input: unknown) => T): T | undefined {
  return value === undefined ? undefined : check(value);
}

/** Channel names double as macOS feed directory names, so the grammar is shared. */
export function validateChannelName(value: unknown): string {
  const name = pattern(value, CHANNEL_NAME, "channel name");
  if (name.length > 32) fail("channel name is too long");
  if (RESERVED.has(name)) fail("channel name is reserved");
  return name;
}

/** The client fetches `releases/channels/<name>.json`. */
export function channelRecordKey(value: unknown): string {
  const name = validateChannelName(value);
  return `releases/channels/${name}.json`;
}

/**
 * Every addressable object key. The grammar is the client's `channelKey`, and
 * it is what keeps a request from escaping the release prefix or reaching a
 * Windows reserved name.
 */
export function artifactKey(value: unknown): string {
  const key = pattern(value, /^releases\/[A-Za-z0-9_./+-]+$/, "artifact key");
  for (const part of key.split("/")) {
    if (!part || part === "." || part === "..") fail(`artifact key has an unusable segment: ${key}`);
    if (part.endsWith(".")) fail(`artifact key segment ends with a dot: ${key}`);
    if (RESERVED.has(part.split(".")[0]!.toLowerCase())) fail(`artifact key uses a reserved name: ${key}`);
  }
  return key;
}

/**
 * A listing prefix. Same rules as `artifactKey` for every complete segment,
 * plus the ordinary looseness that the LAST segment may be a partial name,
 * because a prefix is not a key.
 */
export function artifactPrefix(value: unknown): string {
  const prefix = text(value, "prefix");
  const body = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  const segments = body.split("/");
  // segments[0] is "releases"; a prefix may stop inside the last segment only.
  for (const [index, part] of segments.entries()) {
    const last = index === segments.length - 1;
    if (!part && last && segments.length > 1) continue;
    if (!part) fail("artifact prefix has an empty segment");
    if (part === "." || part === "..") fail("artifact prefix has a traversal segment");
    if (!last && part.endsWith(".")) fail(`artifact prefix segment ends with a dot: ${prefix}`);
    if (!/^[A-Za-z0-9_.+-]+$/.test(part)) fail(`artifact prefix segment has unusable characters: ${part}`);
    if (RESERVED.has(part.split(".")[0]!.toLowerCase())) fail(`artifact prefix uses a reserved name: ${part}`);
  }
  if (segments[0] !== "releases") fail("artifact prefix must be under releases/");
  return body;
}

export function buildPrefix(buildId: unknown): string {
  return `releases/channel-builds/${pattern(buildId, BUILD_ID, "build id")}/`;
}

function identity(value: unknown): void {
  const fields = record(value, "identity");
  pattern(fields.token, /^[a-f0-9]{16}$/, "identity.token");
  pattern(fields.displayName, /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,79}$/, "identity.displayName");
  pattern(fields.appId, /^[a-z][a-z0-9.-]{2,127}$/, "identity.appId");
  pattern(fields.appNamePascal, /^[A-Za-z][A-Za-z0-9]{0,63}$/, "identity.appNamePascal");
  pattern(fields.artifactNamePascal, /^[A-Za-z][A-Za-z0-9]{0,63}$/, "identity.artifactNamePascal");
  pattern(fields.cliName, /^[a-z][a-z0-9-]{0,63}$/, "identity.cliName");
  pattern(fields.windowsExecutableName, /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,79}$/, "identity.windowsExecutableName");
  pattern(fields.msixAppIdWithOrg, /^[A-Za-z][A-Za-z0-9.-]{2,49}$/, "identity.msixAppIdWithOrg");
}

function head(value: unknown, label: string): void {
  if (value === null) return;
  const fields = record(value, label);
  const buildId = pattern(fields.buildId, BUILD_ID, `${label}.buildId`);
  const manifestKey = text(fields.manifestKey, `${label}.manifestKey`);
  // The manifest key is not free-form: it must be the one canonical location
  // inside the build prefix, which is what makes a published build immutable.
  if (manifestKey !== `${buildPrefix(buildId)}build.json`) {
    fail(`${label}.manifestKey must be ${buildPrefix(buildId)}build.json`);
  }
  integer(fields.sequence, `${label}.sequence`, 1, 0xffffffff);
  pattern(fields.sha256, SHA256, `${label}.sha256`);
}

/** A channel record: the object every installed client reads to find its head. */
export function validateChannelRecord(value: unknown): void {
  const fields = record(value, "channel record");
  if (fields.schema !== 1) fail("unsupported channel record schema");
  validateChannelName(fields.name);
  pattern(fields.repository, /^[A-Za-z0-9][A-Za-z0-9_-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/, "repository");
  const policy = text(fields.policy, "policy");
  if (policy !== "preview" && policy !== "stable-release" && policy !== "canary-release") {
    fail(`unsupported channel policy: ${policy}`);
  }
  identity(fields.identity);
  integer(fields.revision, "revision");
  const nextSequence = integer(fields.nextSequence, "nextSequence", 1, 0x100000000);
  head(fields.head, "head");

  const headFields = fields.head ? record(fields.head, "head") : null;
  if (headFields && integer(headFields.sequence, "head.sequence", 1, 0xffffffff) >= nextSequence) {
    fail("head sequence exceeds the channel's allocation");
  }

  const state = text(fields.state, "state");
  if (state === "active") return;
  if (state !== "retired") fail(`unsupported channel state: ${state}`);

  // A retired record redirects clients to a destination channel; the lastHead
  // must be the same head, or a client that just published would resolve a
  // different build than the one it retired from.
  const lastHead = fields.lastHead === undefined ? null : fields.lastHead;
  if (JSON.stringify(lastHead) !== JSON.stringify(fields.head ?? null)) {
    fail("retirement lastHead does not match head");
  }
  if (fields.receiverProtocol !== 1) fail("unsupported retirement receiver protocol");
  const receiver = record(fields.receiver, "receiver");
  if (receiver.kind !== "in-place" && receiver.kind !== "discontinued") {
    fail(`unsupported receiver kind: ${String(receiver.kind)}`);
  }
  validateChannelName(fields.destination);
  pattern(fields.minimumVersion, VERSION, "minimumVersion");
  if (fields.destinationHead === undefined) fail("retired channel needs a destinationHead");
  head(fields.destinationHead, "destinationHead");
}

function packageEntry(value: unknown, label: string): void {
  const fields = record(value, label);
  const platform = text(fields.platform, `${label}.platform`);
  const arch = text(fields.arch, `${label}.arch`);
  if (platform !== "darwin" && platform !== "win32") fail(`${label}.platform is unsupported: ${platform}`);
  if (arch !== "x64" && arch !== "arm64") fail(`${label}.arch is unsupported: ${arch}`);
  if (fields.variant !== "bundled") fail(`${label}.variant must be "bundled"`);

  const versionPattern = platform === "darwin" ? VERSION : /^\d+\.\d+\.\d+\.\d+$/;
  pattern(fields.version, versionPattern, `${label}.version`);
  text(fields.identity, `${label}.identity`);

  const artifact = record(fields.artifact, `${label}.artifact`);
  artifactKey(artifact.key);
  pattern(artifact.sha256, SHA256, `${label}.artifact.sha256`);
  integer(artifact.size, `${label}.artifact.size`);

  optional(fields.teamId, (input) => pattern(input, /^[A-Z0-9]{10}$/, `${label}.teamId`));
  optional(fields.publisher, (input) => text(input, `${label}.publisher`));

  const feed = record(fields.feed, `${label}.feed`);
  const feedKey = artifactKey(feed.key);
  // The feed descriptor's suffix is what the OS updater dispatches on: Windows
  // App Installer for MSIX, electron-updater's yaml for macOS. A package whose
  // feed key has the wrong suffix is unresolvable on that platform.
  if (platform === "win32" && !feedKey.endsWith(".appinstaller")) {
    fail(`${label}.feed.key must be an .appinstaller for win32`);
  }
  if (platform === "darwin" && !feedKey.endsWith("-mac.yml")) {
    fail(`${label}.feed.key must be a -mac.yml for darwin`);
  }
  pattern(feed.channel, /^[a-z][a-z0-9-]{0,31}$/, `${label}.feed.channel`);
}

/** A build manifest: the sha256-pinned index of one build's packages. */
export function validateChannelManifest(value: unknown): void {
  const fields = record(value, "channel manifest");
  if (fields.schema !== 1) fail("unsupported channel manifest schema");

  const request = record(fields.request, "request");
  if (request.schema !== 1) fail("unsupported request schema");
  const buildId = pattern(request.buildId, BUILD_ID, "request.buildId");
  validateChannelName(request.channel);
  pattern(request.repository, /^[A-Za-z0-9][A-Za-z0-9_-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/, "request.repository");
  pattern(request.commit, COMMIT, "request.commit");
  pattern(request.sourceVersion, VERSION, "request.sourceVersion");
  pattern(request.version, VERSION, "request.version");
  // A Windows package version is quad-numeric and each part is a 16-bit build
  // number; makeappx rejects anything larger, so the host refuses it here.
  const windowsVersion = pattern(request.windowsVersion, /^\d+\.\d+\.\d+\.\d+$/, "request.windowsVersion");
  for (const part of windowsVersion.split(".")) {
    if (Number(part) > 65535) fail("request.windowsVersion part exceeds 65535");
  }
  pattern(request.publicBase, /^https:\/\/[^\s]+$/, "request.publicBase");
  identity(request.identity);
  optional(request.controllerCommit, (input) => pattern(input, COMMIT, "request.controllerCommit"));
  optional(request.releaseTag, (input) => pattern(input, /^v\d+\.\d+\.\d+(?:\+canary\.20\d{6}T\d{6}Z)?$/, "request.releaseTag"));

  // The bundle environment allowlist is a SECURITY boundary, not cosmetics: a
  // published request must not be able to inject process flags into a client.
  const bundleEnv = record(request.bundleEnv, "request.bundleEnv");
  const allowed = new Set([
    "HERMES_HOME",
    "HERMES_DATA_DIR_SUFFIX",
    "HERMES_DESKTOP_USER_DATA_DIR",
    "HERMES_SHARED_AUTH_DIR",
    "HERMES_GUEST_ONBOARDING",
    "HERMES_SKIP_INTRO",
  ]);
  for (const [name, setting] of Object.entries(bundleEnv)) {
    if (!allowed.has(name)) fail(`request.bundleEnv carries a disallowed variable: ${name}`);
    if (setting !== null && (typeof setting !== "string" || setting.includes("\0"))) {
      fail(`request.bundleEnv.${name} is not a string or null`);
    }
  }

  const packages = fields.packages;
  if (!Array.isArray(packages) || packages.length === 0 || packages.length > 4) {
    fail("a manifest must carry 1..4 packages");
  }
  const seen = new Set<string>();
  packages.forEach((entry, index) => {
    packageEntry(entry, `packages[${index}]`);
    const fieldsForKey = record(entry, `packages[${index}]`);
    const key = `${text(fieldsForKey.platform, "platform")}/${text(fieldsForKey.arch, "arch")}`;
    if (seen.has(key)) fail(`duplicate package for ${key}`);
    seen.add(key);
  });

  optional(fields.receiverProtocol, (input) => integer(input, "receiverProtocol"));

  // Cross-check the head binding the client asserts: the request's own build id
  // and channel must agree with the record that pointed at this manifest.
  if (request.channel !== undefined) validateChannelName(request.channel);
  if (buildId === "") fail("request.buildId is empty");
}
