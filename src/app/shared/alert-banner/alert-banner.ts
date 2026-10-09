import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheckBig, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-alert-banner',
  standalone: true,
  imports: [LucideCircleAlert, LucideCircleCheckBig, LucideX],
  templateUrl: './alert-banner.html',
})
export class AlertBanner {
  readonly type = input<'success' | 'error' | 'info'>('success');
  readonly message = input.required<string>();
  readonly dismissible = input(true);
  readonly closed = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimer());

    effect(() => {
      this.message();
      if (this.type() === 'info') {
        this.clearTimer();
      } else {
        this.startTimer();
      }
    });
  }

  close(): void {
    this.clearTimer();
    this.closed.emit();
  }

  private startTimer(): void {
    this.clearTimer();
    this.timeoutId = setTimeout(() => this.closed.emit(), 4_000);
  }

  private clearTimer(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
