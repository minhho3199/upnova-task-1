import express, { Response } from "express";
import { scrapeShopifyPage } from "./scraper";

const app = express();
app.use(express.json());
const port = 3000;

app.post("/scrape", async (req, res) => {
  // Validate URL
  if (!req.body.url) {
    res.status(400).json({ error: "URL is required" });
  }
  const { url } = req.body;
  try {
    const styles = await scrapeShopifyPage(url);
    res.json(styles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to scrape the page" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
