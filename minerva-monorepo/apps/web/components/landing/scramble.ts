export const SCRAMBLE_GLYPHS = "ɔıdɥǝɹ";

export function scrambleText(
  from: string,
  to: string,
  onUpdate: (text: string) => void
): number[] {
  const timeouts: number[] = [];
  const n = Math.max(from.length, to.length);
  const chars = from.padEnd(n, " ").split("");
  const target = to.padEnd(n, " ").split("");
  const positions = [
    ...chars.map((c, i) => (c !== " " || target[i] !== " " ? i : null)).filter((i) => i !== null),
  ].sort(() => Math.random() - 0.5);
  positions.forEach((pos, i) => {
    const delay = i * (30 + Math.random() * 25);
    timeouts.push(
      window.setTimeout(() => {
        chars[pos] = SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
        onUpdate(chars.join("").trimEnd());
      }, delay)
    );
    timeouts.push(
      window.setTimeout(() => {
        chars[pos] = target[pos] ?? " ";
        onUpdate(chars.join("").trimEnd());
      }, delay + 100)
    );
  });
  return timeouts;
}
