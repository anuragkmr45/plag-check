const unsafeMethods = new Set(["DELETE", "PATCH", "POST", "PUT"]);

export type CsrfCheckResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "origin_mismatch";
    };

export function verifySameOriginRequest(
  request: Pick<Request, "headers" | "method" | "url">,
  options: {
    force?: boolean;
  } = {}
): CsrfCheckResult {
  if (!options.force && !unsafeMethods.has(request.method.toUpperCase())) {
    return {
      ok: true
    };
  }

  const expectedOrigin = getExpectedOrigin(request);
  const origin = request.headers.get("origin");

  if (origin) {
    return origin === expectedOrigin
      ? {
          ok: true
        }
      : {
          ok: false,
          reason: "origin_mismatch"
        };
  }

  const referer = request.headers.get("referer");

  if (!referer) {
    return {
      ok: true
    };
  }

  return getOrigin(referer) === expectedOrigin
    ? {
        ok: true
      }
    : {
        ok: false,
        reason: "origin_mismatch"
      };
}

function getExpectedOrigin(request: Pick<Request, "headers" | "url">): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (!host) {
    return new URL(request.url).origin;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? new URL(request.url).protocol.replace(":", "");

  return `${protocol}://${host}`;
}

function getOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
