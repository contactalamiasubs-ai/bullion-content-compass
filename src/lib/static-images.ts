import image0_640 from "@/assets/slide-1-640.webp.asset.json";
import image0_1280 from "@/assets/slide-1-1280.webp.asset.json";
import image0_1920 from "@/assets/slide-1-1920.webp.asset.json";
import image1_640 from "@/assets/slide-2-640.webp.asset.json";
import image1_1280 from "@/assets/slide-2-1280.webp.asset.json";
import image1_1920 from "@/assets/slide-2-1920.webp.asset.json";
import image2_640 from "@/assets/slide-3-640.webp.asset.json";
import image2_1280 from "@/assets/slide-3-1280.webp.asset.json";
import image2_1920 from "@/assets/slide-3-1920.webp.asset.json";
import image3_640 from "@/assets/slide-4-640.webp.asset.json";
import image3_1280 from "@/assets/slide-4-1280.webp.asset.json";
import image3_1920 from "@/assets/slide-4-1920.webp.asset.json";
import image4_640 from "@/assets/login-gold-market-640.webp.asset.json";
import image4_1280 from "@/assets/login-gold-market-1280.webp.asset.json";
import image4_1920 from "@/assets/login-gold-market-1920.webp.asset.json";
// Relative Lovable asset paths do not exist on external hosting.
const assetUrl = (asset: { url: string }) => new URL(asset.url, "https://bullion-content-compass.lovable.app").href;
export const staticImages = {
  "slide-1": assetUrl(image0_1920),
  "slide-2": assetUrl(image1_1920),
  "slide-3": assetUrl(image2_1920),
  "slide-4": assetUrl(image3_1920),
  "login-gold-market": assetUrl(image4_1920),
};
export const staticImageVariants: Record<string, { width: number; url: string }[]> = {
  [assetUrl(image0_1920)]: [{width:640,url:assetUrl(image0_640)}, {width:1280,url:assetUrl(image0_1280)}, {width:1920,url:assetUrl(image0_1920)}],
  [assetUrl(image1_1920)]: [{width:640,url:assetUrl(image1_640)}, {width:1280,url:assetUrl(image1_1280)}, {width:1920,url:assetUrl(image1_1920)}],
  [assetUrl(image2_1920)]: [{width:640,url:assetUrl(image2_640)}, {width:1280,url:assetUrl(image2_1280)}, {width:1920,url:assetUrl(image2_1920)}],
  [assetUrl(image3_1920)]: [{width:640,url:assetUrl(image3_640)}, {width:1280,url:assetUrl(image3_1280)}, {width:1920,url:assetUrl(image3_1920)}],
  [assetUrl(image4_1920)]: [{width:640,url:assetUrl(image4_640)}, {width:1280,url:assetUrl(image4_1280)}, {width:1920,url:assetUrl(image4_1920)}],
};
