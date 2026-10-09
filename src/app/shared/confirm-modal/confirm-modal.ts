import { Component, HostListener, input, output } from '@angular/core';
import { LucideCircleAlert, LucideTrash2 } from '@lucide/angular';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [LucideCircleAlert, LucideTrash2],
  templateUrl: './confirm-modal.html',
})
export class ConfirmModal {
  readonly open = input(false);
  readonly title = input('Confirmar acción');
  readonly message = input('');
  readonly confirmText = input('Eliminar');
  readonly cancelText = input('Cancelar');
  readonly variant = input<'danger' | 'primary'>('danger');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.cancel();
    }
  }

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
