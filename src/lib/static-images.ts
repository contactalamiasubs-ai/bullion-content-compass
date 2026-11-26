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
export const staticImages = {
  "slide-1": image0_1920.url,
  "slide-2": image1_1920.url,
  "slide-3": image2_1920.url,
  "slide-4": image3_1920.url,
  "login-gold-market": image4_1920.url,
};
export const staticImageVariants: Record<string, { width: number; url: string }[]> = {
  [image0_1920.url]: [{width:640,url:image0_640.url}, {width:1280,url:image0_1280.url}, {width:1920,url:image0_1920.url}],
  [image1_1920.url]: [{width:640,url:image1_640.url}, {width:1280,url:image1_1280.url}, {width:1920,url:image1_1920.url}],
  [image2_1920.url]: [{width:640,url:image2_640.url}, {width:1280,url:image2_1280.url}, {width:1920,url:image2_1920.url}],
  [image3_1920.url]: [{width:640,url:image3_640.url}, {width:1280,url:image3_1280.url}, {width:1920,url:image3_1920.url}],
  [image4_1920.url]: [{width:640,url:image4_640.url}, {width:1280,url:image4_1280.url}, {width:1920,url:image4_1920.url}],
};
