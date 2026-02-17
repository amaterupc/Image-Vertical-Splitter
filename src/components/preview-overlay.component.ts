import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-preview-overlay',
  template: `
    <div class="absolute inset-0 pointer-events-none border border-slate-500/50 rounded-lg overflow-hidden">
      <!-- Image overlay container -->
      @for (pos of linePositions(); track $index) {
        <div 
          class="absolute w-full border-t border-brand-400 border-dashed shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
          [style.top.%]="pos"
        >
          <span class="absolute right-0 -top-3 bg-brand-500 text-[10px] text-white px-1 rounded opacity-75">
            {{$index + 1}}
          </span>
        </div>
      }
    </div>
  `
})
export class PreviewOverlayComponent {
  splitCount = input.required<number>();
  splitMode = input.required<'balanced' | 'last'>();
  imageHeight = input.required<number>();

  // Calculate percentage positions for the horizontal lines
  linePositions = computed(() => {
    const count = this.splitCount();
    const mode = this.splitMode();
    const totalH = this.imageHeight();
    
    if (!totalH || count < 2) return [];

    const positions: number[] = [];
    const baseHeight = Math.floor(totalH / count);
    const remainder = totalH % count;
    
    let currentY = 0;

    // We need N-1 lines
    for (let i = 0; i < count - 1; i++) {
      let sliceH = baseHeight;
      if (mode === 'balanced') {
        if (i < remainder) sliceH += 1;
      }
      
      currentY += sliceH;
      const percentage = (currentY / totalH) * 100;
      positions.push(percentage);
    }

    return positions;
  });
}
