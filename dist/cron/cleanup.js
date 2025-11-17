"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleCleanup = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const fileService_1 = require("../services/fileService");
const fileService = fileService_1.FileService.getInstance();
const scheduleCleanup = () => {
    // Run daily at 3 AM
    node_cron_1.default.schedule("0 3 * * *", async () => {
        try {
            console.log(":: Running daily file cleanup job...");
            const deletedCount = await fileService.cleanupOldFiles(7);
            console.log(`:: Deleted ${deletedCount} old files`);
        }
        catch (err) {
            console.error("Cleanup job failed:", err);
        }
    });
};
exports.scheduleCleanup = scheduleCleanup;
