import puppeteer from "puppeteer";

export async function scrapeShopifyPage(url: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  const fonts = await page.evaluate(() => {
    const fontsInfo: {
      family: string;
      variants: string;
      fontWeight: string;
      fontStyle: string;
      url: string;
    }[] = [];

    // Iterate over all stylesheets
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        // Iterate over all rules within a stylesheet
        Array.from(sheet.cssRules).forEach((rule) => {
          // Check if the rule is an instance of CSSFontFaceRule
          if (rule instanceof CSSFontFaceRule) {
            const family = rule.style.fontFamily.replace(/['"]+/g, "").trim();
            const weight = rule.style.fontWeight || "400"; // Default to 400 if missing
            const style = rule.style.fontStyle || "normal"; // Default to normal if missing
            const src = rule.style
              .getPropertyValue("src")
              .replace(/^url\(["']?/, "")
              .replace(/["']?\)$/, "");

            // Check for valid family and src before adding to the fonts array
            if (family && src) {
              fontsInfo.push({
                family,
                variants: weight, // Use font-weight as the variant
                fontWeight: weight,
                fontStyle: style,
                url: src,
              });
            }
          }
        });
      } catch (e) {
        console.warn("Error reading stylesheet", e);
      }
    });

    return fontsInfo;
  });

  // Extract all button styles dynamically and ensure uniqueness using Set
  const buttonStyles = await page.evaluate(() => {
    const buttons = document.querySelectorAll("button"); // Get all button elements
    const uniqueButtonStyles = new Set<string>();

    buttons.forEach((button) => {
      const styles = window.getComputedStyle(button);
      const styleString = JSON.stringify({
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        lineHeight: styles.lineHeight,
        letterSpacing: styles.letterSpacing,
        textTransform: styles.textTransform,
        textDecoration: styles.textDecoration,
        textAlign: styles.textAlign,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        borderColor: styles.borderColor,
        borderWidth: styles.borderWidth,
        borderRadius: styles.borderRadius,
      });

      // Add the style string to the Set (only unique values will be kept)
      uniqueButtonStyles.add(styleString);
    });

    // Convert the Set back to an array of button styles
    return Array.from(uniqueButtonStyles).map((style) => JSON.parse(style));
  });

  await browser.close();

  // Return the extracted font and button styles
  return {
    fonts,
    buttonStyles,
  };
}
