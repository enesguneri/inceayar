import { resolveRedirectUrl } from "../services/scraper";

describe("Scraper Redirect Resolver", () => {
  it("should resolve a ty.gl short redirect URL to a trendyol.com product URL", async () => {
    const shortUrl = "https://ty.gl/kmrwc6to13k0i";
    const resolvedUrl = await resolveRedirectUrl(shortUrl);
    
    expect(resolvedUrl).toContain("trendyol.com");
    expect(resolvedUrl).toContain("-p-");
  }, 20000); // Dış ağa istek atıldığı için zaman aşımını 20 sn tanımladık

  it("should return the original URL if it is already a direct platform URL", async () => {
    const originalUrl = "https://www.trendyol.com/WD/Elements-2TB-USB-3-0-p-2052963";
    const resolvedUrl = await resolveRedirectUrl(originalUrl);
    
    expect(resolvedUrl).toBe(originalUrl);
  });
});
