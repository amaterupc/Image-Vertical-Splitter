import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  template: `
    <div 
      class="relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 group cursor-pointer hover:border-slate-400"
      [class.border-brand-500]="isDragging()"
      [class.bg-brand-500]="isDragging()"
      [class.bg-opacity-10]="isDragging()"
      [class.border-slate-600]="!isDragging()"
      [class.bg-slate-800]="!isDragging()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input 
        #fileInput 
        type="file" 
        class="hidden" 
        accept="image/png, image/jpeg, image/webp" 
        (change)="onFileSelected($event)"
      >
      
      <div class="flex flex-col items-center gap-3">
        <div class="p-3 bg-slate-700 rounded-full group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p class="text-lg font-medium text-slate-200">
            クリックしてアップロード<br>
            またはドラッグ＆ドロップ
          </p>
          <p class="text-sm text-slate-400 mt-1">
            PNG, JPG, WEBP 対応
          </p>
        </div>
      </div>
    </div>
  `
})
export class FileUploadComponent {
  file = output<File>();
  isDragging = signal(false);

  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    if (file.type.startsWith('image/')) {
      this.file.emit(file);
    } else {
      alert('有効な画像ファイルをアップロードしてください。');
    }
  }
}
