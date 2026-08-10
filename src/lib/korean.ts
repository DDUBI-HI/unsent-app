export function josa(word: string, withBatchim: string, withoutBatchim: string) {
  const last = word.trim().at(-1);
  if (!last) return withoutBatchim;
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return withoutBatchim;
  return code % 28 === 0 ? withoutBatchim : withBatchim;
}
