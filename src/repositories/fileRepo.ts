import { FileModel, FileRecord } from "../models/file";

export class FileRepository {
  private static instance: FileRepository;
  private constructor() {}

  public static getInstance(): FileRepository {
    if (!FileRepository.instance) {
      FileRepository.instance = new FileRepository();
    }
    return FileRepository.instance;
  }

  async saveFile(file: FileRecord) {
    return await FileModel.create({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      path: file.path,
      s3Key: file.s3Key,
      uploadedAt: file.uploadedAt
    });
  }

  async getAllFiles() {
    return await FileModel.find().lean();
  }

  async getFileById(id: string) {
    return await FileModel.findOne({ id }).lean();
  }

  async deleteFileById(id: string) {
    return await FileModel.findOneAndDelete({ id });
  }

  async findOlderThan(date: Date) {
  return FileModel.find({ uploadedAt: { $lt: date } });
}
async deleteById(id: string) {
  return FileModel.deleteOne({ fileId: id });
}
}