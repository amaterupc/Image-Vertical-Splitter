import { Injectable } from '@angular/core';
import JSZip from 'jszip';

export interface SplitResult {
  blob: Blob;
  url: string;
  filename: string;
  height: number;
  width: number;
  index: number;
}

export interface SplitOptions {
  splitCount: number;
  splitMode: 'balanced' | 'last'; // 'balanced' distributes remainder, 'last' adds to last slice
  outputFormat: 'png' | 'jpeg';
  quality: number; // 0.1 to 1.0 for jpeg
  prefix: string;
  backgroundColor: string; // Hex color for JPEG background
}

@Injectable({
  providedIn: 'root'
})
export class ImageProcessorService {

  async processImage(file: File, options: SplitOptions): Promise<SplitResult[]> {
    const imageBitmap = await createImageBitmap(file);
    const { width, height } = imageBitmap;
    
    // Calculate slice heights
    const slices = this.calculateSliceHeights(height, options.splitCount, options.splitMode);
    
    const results: SplitResult[] = [];
    let currentY = 0;

    // Process slices
    // Using a loop with await to avoid freezing UI too much (though createImageBitmap is fast, toBlob is async)
    for (let i = 0; i < slices.length; i++) {
      const sliceHeight = slices[i];
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = sliceHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not get 2D context');

      // Fill background if JPEG
      if (options.outputFormat === 'jpeg') {
        ctx.fillStyle = options.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, width, sliceHeight);
      }

      // Draw portion of image
      ctx.drawImage(
        imageBitmap,
        0, currentY, width, sliceHeight, // Source
        0, 0, width, sliceHeight         // Destination
      );

      // Convert to Blob
      const mimeType = options.outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
      const quality = options.outputFormat === 'jpeg' ? options.quality : undefined;
      
      const blob = await new Promise<Blob | null>(resolve => 
        canvas.toBlob(resolve, mimeType, quality)
      );

      if (!blob) throw new Error('Failed to create blob');

      const ext = options.outputFormat === 'jpeg' ? 'jpg' : 'png';
      
      // User requirement: match digit count of N.
      const digits = options.splitCount.toString().length;
      const finalIndex = (i + 1).toString().padStart(digits, '0');
      
      const filename = `${options.prefix}_${finalIndex}.${ext}`;

      results.push({
        blob,
        url: URL.createObjectURL(blob),
        filename,
        height: sliceHeight,
        width,
        index: i + 1
      });

      currentY += sliceHeight;
    }

    return results;
  }

  calculateSliceHeights(totalHeight: number, count: number, mode: 'balanced' | 'last'): number[] {
    const baseHeight = Math.floor(totalHeight / count);
    const remainder = totalHeight % count;
    const heights: number[] = [];

    if (mode === 'balanced') {
      // Distribute remainder: first 'remainder' slices get +1px
      for (let i = 0; i < count; i++) {
        heights.push(baseHeight + (i < remainder ? 1 : 0));
      }
    } else {
      // Add remainder to the last slice
      for (let i = 0; i < count - 1; i++) {
        heights.push(baseHeight);
      }
      heights.push(baseHeight + remainder);
    }
    return heights;
  }

  async generateZip(results: SplitResult[], zipFilename: string): Promise<Blob> {
    const zip = new JSZip();
    results.forEach(res => {
      zip.file(res.filename, res.blob);
    });

    return await zip.generateAsync({ type: 'blob' });
  }
}