import { describe, expect, it, vi } from "vitest";
import { cachedMediaBytes } from "@/lib/media-delivery";
import { mediaResponse } from "@/lib/media-access";

describe("Stable cached media bytes", () => {
  it("streams the authorized image with bounded browser and CDN caching", async () => {
    const response = cachedMediaBytes(new Response("image-bytes", {headers: {"Content-Type": "image/webp"}}));
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300, s-maxage=300");
    expect(response.headers.get("Content-Type")).toBe("image/webp");
    expect(await response.text()).toBe("image-bytes");
  });
  it("never streams an unpublished image", async () => {
    const deliver = vi.fn();
    expect((await mediaResponse("private.jpg", { isPublished: async () => false, sign: async () => "unused", deliver }, 640)).status).toBe(404);
    expect(deliver).not.toHaveBeenCalled();
  });
  it("does not cache failed upstream downloads", () => {
    const response = cachedMediaBytes(new Response(null,{status:404}));
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("does not execute uploaded HTML on the app origin", () => {
    const response = cachedMediaBytes(new Response("<script>active</script>",{headers:{"Content-Type":"text/html"}}));
    expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
    expect(response.headers.get("Content-Disposition")).toBe("attachment");
    expect(response.headers.get("Content-Security-Policy")).toBe("sandbox");
  });
  it("preserves partial PDF responses", () => {
    const response = cachedMediaBytes(new Response("pdf-part",{status:206,headers:{"Content-Type":"application/pdf","Content-Range":"bytes 0-7/100","Accept-Ranges":"bytes"}}));
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 0-7/100");
  });
});