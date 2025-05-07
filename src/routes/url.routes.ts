import express from "express";
import * as urlController from "../controllers/url.controller";

const router = express.Router();

router.post("/encurtar", urlController.createShortUrl);
router.get("/list", urlController.getAllUrls);
router.delete("/delete/:shortCode", urlController.deleteUrl); // Certifique-se de que esta rota está correta
router.get("/stats/:shortCode", urlController.getUrlStats);

export default router;
