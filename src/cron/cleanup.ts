import cron from "node-cron";
import { FileService } from "../services/fileService";

const fileService = FileService.getInstance();

export const scheduleCleanup = () => {
  // Run daily at 3 AM
  cron.schedule("0 3 * * *", async () => {
    try {
      console.log(":: Running daily file cleanup job...");
      const deletedCount = await fileService.cleanupOldFiles(7);
      console.log(`:: Deleted ${deletedCount} old files`);
    } catch (err) {
      console.error("Cleanup job failed:", err);
    }
  });
};
