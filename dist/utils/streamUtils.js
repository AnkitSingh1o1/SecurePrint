"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNodeReadable = toNodeReadable;
exports.bodyToBuffer = bodyToBuffer;
const stream_1 = require("stream");
/**
 * Use when you want to stream to the client efficiently
 * Output: Readable stream (streaming)
 * UseCase: Direct streaming to client
 * @param body
 * @returns
 */
async function toNodeReadable(body) {
    if (!body)
        throw new Error("S3 Body is empty");
    //Already a Node.js Readable
    if (body instanceof stream_1.Readable) {
        return body;
    }
    // AWS transformToByteArray
    if (typeof body.transformToByteArray === "function") {
        const bytes = await body.transformToByteArray();
        return stream_1.Readable.from(Buffer.from(bytes));
    }
    //Browser/Web ReadableStream
    if (body.getReader) {
        const reader = body.getReader();
        const chunks = [];
        let result = await reader.read();
        while (!result.done) {
            chunks.push(result.value);
            result = await reader.read();
        }
        return stream_1.Readable.from(Buffer.concat(chunks));
    }
    //Blob
    if (typeof Blob !== "undefined" && body instanceof Blob) {
        const arrayBuffer = await body.arrayBuffer();
        return stream_1.Readable.from(Buffer.from(arrayBuffer));
    }
    //ArrayBuffer
    if (body instanceof ArrayBuffer) {
        return stream_1.Readable.from(Buffer.from(body));
    }
    //Uint8Array
    if (body instanceof Uint8Array) {
        return stream_1.Readable.from(Buffer.from(body));
    }
    //Fallback
    return stream_1.Readable.from(body);
}
/**
 * Use when you need the complete data in memory
 * Output: Buffer (in memory)
 * UseCase: Loading into memory for processing
 * @param body
 * @returns
 */
async function bodyToBuffer(body) {
    if (!body)
        throw new Error("Empty S3 body");
    //Node Readable
    if (body instanceof stream_1.Readable) {
        const chunks = [];
        for await (const chunk of body) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    //Web ReadableStream
    if (typeof body.getReader === "function") {
        const reader = body.getReader();
        const chunks = [];
        let result = await reader.read();
        while (!result.done) {
            chunks.push(result.value);
            result = await reader.read();
        }
        return Buffer.concat(chunks.map((c) => Buffer.from(c)));
    }
    //Blob
    if (typeof Blob !== "undefined" && body instanceof Blob) {
        const arrayBuffer = await body.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    //transformToByteArray (AWS)
    if (typeof body.transformToByteArray === "function") {
        const bytes = await body.transformToByteArray();
        return Buffer.from(bytes);
    }
    //ArrayBuffer / Uint8Array
    if (body instanceof ArrayBuffer)
        return Buffer.from(body);
    if (body instanceof Uint8Array)
        return Buffer.from(body);
    return Buffer.from(body);
}
