/**
 * API route for processing images from R2 with Sharp
 * Used for large images that were uploaded via presigned URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { getR2Config } from '@/lib/r2';
import { QUALITY_PRESETS, type ExportApiResponse, type ExportFormat, type QualityPreset } from '@/lib/export/types';

function isValidFormat(format: string): format is ExportFormat {
  return format === 'png' || format === 'jpeg';
}

function isValidQualityPreset(preset: string): preset is QualityPreset {
  return preset === 'high' || preset === 'medium' || preset === 'low';
}

// Initialize S3 client for R2
function getS3Client() {
  const config = getR2Config();

  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, format, qualityPreset } = body;

    // Validate required fields
    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid R2 key' },
        { status: 400 }
      );
    }

    if (!format || !isValidFormat(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be "png" or "jpeg"' },
        { status: 400 }
      );
    }

    if (!qualityPreset || !isValidQualityPreset(qualityPreset)) {
      return NextResponse.json(
        { error: 'Invalid qualityPreset. Must be "high", "medium", or "low"' },
        { status: 400 }
      );
    }

    const config = getR2Config();
    if (!config.bucketName) {
      return NextResponse.json(
        { error: 'R2 bucket not configured' },
        { status: 500 }
      );
    }

    const s3Client = getS3Client();

    // Fetch image from R2
    const getCommand = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    const response = await s3Client.send(getCommand);

    if (!response.Body) {
      return NextResponse.json(
        { error: 'Failed to fetch image from R2' },
        { status: 500 }
      );
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const inputBuffer = Buffer.concat(chunks);
    const qualitySettings = QUALITY_PRESETS[qualityPreset];

    let sharpInstance = sharp(inputBuffer);
    let outputBuffer: Buffer;
    let mimeType: string;

    if (format === 'jpeg') {
      outputBuffer = await sharpInstance
        .jpeg({
          quality: qualitySettings.jpeg,
          mozjpeg: true,
        })
        .toBuffer();
      mimeType = 'image/jpeg';
    } else {
      // Lossless PNG — only compressionLevel + adaptiveFiltering.
      // Do NOT pass effort/quality/colours — they enable palette mode
      // which quantises to ≤256 colours and destroys shadow gradients.
      outputBuffer = await sharpInstance
        .png({
          compressionLevel: qualitySettings.pngCompression,
          adaptiveFiltering: true,
        })
        .toBuffer();
      mimeType = 'image/png';
    }

    // Clean up: delete the temporary file from R2
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      });
      await s3Client.send(deleteCommand);
    } catch (deleteError) {
      // Log but don't fail - the processed image is more important
      console.warn('Failed to delete temp file from R2:', deleteError);
    }

    // Convert output buffer to base64
    const outputBase64 = outputBuffer.toString('base64');

    const result: ExportApiResponse = {
      imageData: outputBase64,
      mimeType,
      fileSize: outputBuffer.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Process API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process image' },
      { status: 500 }
    );
  }
}
