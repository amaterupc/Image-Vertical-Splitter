import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadComponent } from './components/file-upload.component';
import { PreviewOverlayComponent } from './components/preview-overlay.component';
import { ImageProcessorService, SplitResult, SplitOptions } from './services/image-processor.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FileUploadComponent, PreviewOverlayComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private imageProcessor = inject(ImageProcessorService);

  // Signals for state
  file = signal<File | null>(null);
  imageUrl = signal<string>('');
  imageDimensions = signal<{width: number, height: number}>({width: 0, height: 0});
  
  splitCount = signal<number>(2);
  splitMode = signal<'balanced' | 'last'>('balanced');
  outputFormat = signal<'png' | 'jpeg'>('png');
  quality = signal<number>(0.8);
  filenamePrefix = signal<string>('');
  
  isProcessing = signal<boolean>(false);
  slices = signal<SplitResult[]>([]);

  // Computed
  totalSlicesHeight = computed(() => {
    return this.slices().reduce((acc, slice) => acc + slice.height, 0);
  });

  // Computed for previewing slice heights before processing
  sliceHeightSummary = computed(() => {
    const h = this.imageDimensions().height;
    const count = this.splitCount();
    const mode = this.splitMode();
    
    if (h === 0 || count < 1) return '-';

    const heights = this.imageProcessor.calculateSliceHeights(h, count, mode);
    const min = Math.min(...heights);
    const max = Math.max(...heights);

    if (min === max) {
      return `${min} px`;
    }
    return `${min} - ${max} px`;
  });

  constructor() {
    // Revoke object URL when file changes to avoid memory leaks
    effect(() => {
      const url = this.imageUrl();
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    });
  }

  onFileSelected(file: File) {
    this.file.set(file);
    const url = URL.createObjectURL(file);
    this.imageUrl.set(url);
    
    // Set default prefix based on filename (remove extension)
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    this.filenamePrefix.set(nameWithoutExt);

    // Get dimensions
    const img = new Image();
    img.onload = () => {
      this.imageDimensions.set({
        width: img.width,
        height: img.height
      });
    };
    img.src = url;
    
    // Reset slices
    this.slices.set([]);
  }

  reset() {
    this.file.set(null);
    this.imageUrl.set('');
    this.slices.set([]);
    this.imageDimensions.set({width: 0, height: 0});
  }

  clearResults() {
    this.slices.set([]);
  }

  updateSplitCount(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val >= 2 && val <= 50) {
      this.splitCount.set(val);
    }
  }

  updateFormat(e: Event) {
    this.outputFormat.set((e.target as HTMLSelectElement).value as 'png' | 'jpeg');
  }

  updateQuality(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 0.1 && val <= 1.0) {
      this.quality.set(val);
    }
  }

  updatePrefix(e: Event) {
    this.filenamePrefix.set((e.target as HTMLInputElement).value);
  }

  async processSplits() {
    const file = this.file();
    if (!file) return;

    this.isProcessing.set(true);

    // Use requestAnimationFrame/setTimeout to allow UI to update (show spinner) before heavy work
    setTimeout(async () => {
      try {
        const options: SplitOptions = {
          splitCount: this.splitCount(),
          splitMode: this.splitMode(),
          outputFormat: this.outputFormat(),
          quality: this.quality(),
          prefix: this.filenamePrefix() || 'split',
          backgroundColor: '#ffffff'
        };

        const results = await this.imageProcessor.processImage(file, options);
        this.slices.set(results);
      } catch (error) {
        console.error('Split failed', error);
        alert('画像の分割に失敗しました。コンソールログを確認してください。');
      } finally {
        this.isProcessing.set(false);
      }
    }, 50);
  }

  async downloadZip() {
    const currentSlices = this.slices();
    if (currentSlices.length === 0) return;

    try {
      const zipBlob = await this.imageProcessor.generateZip(
        currentSlices, 
        `${this.filenamePrefix()}_split.zip`
      );
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.filenamePrefix()}_all.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Zip generation failed', error);
      alert('ZIPの生成に失敗しました。JSZipがロードされているか確認してください。');
    }
  }
}
