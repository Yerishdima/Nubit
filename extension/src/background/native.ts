// Bridge to the native messaging host (native-host/host.js) running on the user's computer.

export interface ExecResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
}

export class NativeHostError extends Error {}

function friendly(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/not found|Specified native messaging host/i.test(msg)) {
    return 'Native host is not installed (run native-host/install.bat and reload the extension).';
  }
  if (/Access to the specified native messaging host is forbidden/i.test(msg)) {
    return 'Native host manifest does not allow this extension ID (re-run install.bat with the current extension ID).';
  }
  if (/Native host has exited/i.test(msg)) {
    return 'Native host exited unexpectedly (is Node.js installed? check native-host/host.log).';
  }
  return msg;
}

export async function nativeCall<T = unknown>(host: string, message: Record<string, unknown>): Promise<T> {
  try {
    const res = (await chrome.runtime.sendNativeMessage(host, message)) as { ok?: boolean; error?: string } & T;
    if (res && typeof res === 'object' && res.ok === false) throw new NativeHostError(res.error ?? 'native host error');
    return res as T;
  } catch (err) {
    if (err instanceof NativeHostError) throw err;
    throw new NativeHostError(friendly(err));
  }
}

export interface PingResult {
  ok: boolean;
  version: string;
  node: string;
  platform: string;
}

export function nativePing(host: string): Promise<PingResult> {
  return nativeCall<PingResult>(host, { cmd: 'ping' });
}

export function nativeWhich(host: string, name: string): Promise<{ path: string | null }> {
  return nativeCall(host, { cmd: 'which', name });
}

export function nativeExec(
  host: string,
  path: string,
  args: string[],
  opts: { timeoutMs?: number; maxOutput?: number } = {},
): Promise<ExecResult> {
  return nativeCall<ExecResult>(host, { cmd: 'exec', path, args, timeoutMs: opts.timeoutMs ?? 120000, maxOutput: opts.maxOutput ?? 200000 });
}

export interface SubsResult {
  lang: string;
  auto: boolean;
  text: string;
  available: string[];
}

/** Downloads subtitles with yt-dlp (handled inside the host to keep the message small). */
export function nativeSubtitles(host: string, ytdlpPath: string, videoUrl: string, langs: string[]): Promise<SubsResult> {
  return nativeCall<SubsResult>(host, { cmd: 'ytdlp_subs', path: ytdlpPath, url: videoUrl, langs, timeoutMs: 180000 });
}
