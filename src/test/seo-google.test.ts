import { afterEach, describe, expect, it, vi } from "vitest";
import { forwardSeoGoogle, seoGoogleBridgeUrl, seoGoogleCommand } from "@/lib/seo-google-bridge";
import { assertSeoPermission, executeGoogleCommand } from "@/lib/seo-google-actions.server";
import { googleCall } from "@/lib/seo-google.server";
import type { AdminContext } from "@/lib/admin-users.server";

afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe("SEO Google access and hosting",()=>{
  it("requires SEO permission before invoking a Google action",async()=>{
    const rpc=vi.fn().mockResolvedValue({data:false,error:null});
    const context={userId:"member",supabase:{rpc}} as unknown as AdminContext;
    await expect(executeGoogleCommand({action:"status"},context)).rejects.toMatchObject({status:403});
    expect(rpc).toHaveBeenCalledWith("has_dashboard_permission",{_user_id:"member",_permission:"seo"});
  });
  it("permits the SEO-authorized member",async()=>{
    const context={userId:"seo-member",supabase:{rpc:vi.fn().mockResolvedValue({data:true,error:null})}} as unknown as AdminContext;
    await expect(assertSeoPermission(context)).resolves.toBeUndefined();
  });
  it("never forwards Google requests without a session",async()=>{
    const send=vi.fn();await expect(forwardSeoGoogle(null,{action:"status"},send)).rejects.toMatchObject({status:401});expect(send).not.toHaveBeenCalled();
  });
  it("pins the hosted destination and never follows redirects with the bearer",async()=>{
    const send=vi.fn().mockResolvedValue(new Response(null,{status:301,headers:{Location:"https://other.test"}}));
    await expect(forwardSeoGoogle("Bearer account-session",{action:"status"},send)).rejects.toMatchObject({status:502});
    expect(send).toHaveBeenCalledOnce();expect(send).toHaveBeenCalledWith("https://bullion-content-compass.lovable.app/api/public/seo-google",expect.objectContaining({redirect:"manual"}));
  });
  it("returns the hosted result rather than a synthetic connection",async()=>{
    const send=vi.fn().mockResolvedValue(Response.json({data:{searchConsoleConnected:true,analyticsConnected:false}}));
    expect(await forwardSeoGoogle("Bearer account-session",{action:"status"},send)).toEqual({searchConsoleConnected:true,analyticsConnected:false});
    expect(seoGoogleBridgeUrl).toBe("https://bullion-content-compass.lovable.app/api/public/seo-google");
  });
  it("rejects private indexing targets and extra command fields",()=>{
    expect(seoGoogleCommand.safeParse({action:"inspect",path:"/admin"}).success).toBe(false);
    expect(seoGoogleCommand.safeParse({action:"status",url:"https://other.test"}).success).toBe(false);
  });
  it("honors Google Retry-After and stops after the failed call",async()=>{
    vi.stubEnv("GOOGLE_SEARCH_CONSOLE_API_KEY","test-connection");vi.stubEnv("LOVABLE_API_KEY","test-key");
    const send=vi.fn().mockResolvedValue(new Response("Quota exceeded",{status:429,headers:{"Retry-After":"120"}}));vi.stubGlobal("fetch",send);
    const before=Date.now();try{await googleCall("/webmasters/v3/sites");throw new Error("expected rejection");}catch(error){expect(error).toMatchObject({status:429});if(error&&typeof error==="object"&&"retryAt" in error){expect(Date.parse(String(error.retryAt))).toBeGreaterThanOrEqual(before+120000);}}
    expect(send).toHaveBeenCalledOnce();
  });
});