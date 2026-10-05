export default function Home() {
  return (
    <main style={{ maxWidth: "70ch" }}>
      <h1 style={{ fontSize: "28px", margin: 0 }}>Minerva Assets</h1>
      <p style={{ color: "#a0a0b8" }}>
        Read-only origin for the Minerva Desktop release-channel protocol. There is nothing to see here;
        every path is a protocol endpoint.
      </p>
      <h2 style={{ fontSize: "16px", marginTop: "2rem" }}>Endpoints</h2>
      <ul style={{ paddingLeft: "1.2rem" }}>
        <li>
          <code>GET /releases/channels/&lt;channel&gt;.json</code> — the channel record. Validated before
          it is served.
        </li>
        <li>
          <code>GET /releases/&lt;key&gt;</code> — build manifests, feed descriptors and artifacts.
          <code> build.json</code> is validated; artifacts stream through.
        </li>
        <li>
          <code>GET /health</code> — liveness plus the resolved object source.
        </li>
      </ul>
      <p style={{ color: "#a0a0b8" }}>
        This origin never writes. Publishing is a separate credentialed step in the product repository, so
        this service needs no write credentials at all.
      </p>
    </main>
  );
}
