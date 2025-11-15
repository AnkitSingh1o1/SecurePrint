import { Readable } from "stream";

export async function toNodeReadable(body: any): Promise<Readable> {
  if (!body) throw new Error("S3 Body is empty");

  //Already a Node.js Readable
  if (body instanceof Readable) {
    return body;
  }

  //Browser/Web ReadableStream
  if (body.getReader) {
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];

    let result = await reader.read();
    while (!result.done) {
      chunks.push(result.value);
      result = await reader.read();
    }

    return Readable.from(Buffer.concat(chunks));
  }

  //Blob
  if (typeof Blob !== "undefined" && body instanceof Blob) {
    const arrayBuffer = await body.arrayBuffer();
    return Readable.from(Buffer.from(arrayBuffer));  
  }

  //ArrayBuffer
  if (body instanceof ArrayBuffer) {
    return Readable.from(Buffer.from(body)); 
  }

  //Uint8Array
  if (body instanceof Uint8Array) {
    return Readable.from(Buffer.from(body));
  }

  //Fallback
  return Readable.from(body);
}
