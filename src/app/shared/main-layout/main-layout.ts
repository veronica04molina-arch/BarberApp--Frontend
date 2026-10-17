import { DOCUMENT } from '@angular/common';
import { Component, HostListener, OnDestroy, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { AppHeader } from '../app-header/app-header';
import { AppSidebar } from '../app-sidebar/app-sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, AppHeader, AppSidebar],
  templateUrl: './main-layout.html',
})
export class MainLayout implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private overflowAnterior: string | null = null;

  readonly menuAbierto = signal(false);

  constructor() {
    effect(() => {
      if (this.menuAbierto()) {
        this.bloquearScroll();
      } else {
        this.restaurarScroll();
      }
    });

    this.router.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.cerrarMenu());
  }

  abrirMenu(): void {
    this.menuAbierto.set(true);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
    this.restaurarScroll();
  }

  @HostListener('document:keydown.escape')
  cerrarMenuConEscape(): void {
    if (this.menuAbierto()) this.cerrarMenu();
  }

  ngOnDestroy(): void {
    this.restaurarScroll();
  }

  private bloquearScroll(): void {
    if (this.overflowAnterior !== null) return;

    this.overflowAnterior = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
  }

  private restaurarScroll(): void {
    if (this.overflowAnterior === null) return;

    this.document.body.style.overflow = this.overflowAnterior;
    this.overflowAnterior = null;
  }
}
