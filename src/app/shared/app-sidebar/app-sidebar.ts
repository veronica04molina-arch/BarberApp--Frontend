import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideCalendarDays,
  LucideCalendarPlus,
  LucideChartColumn,
  LucideDynamicIcon,
  LucideHome,
  LucideIcon,
  LucideListChecks,
  LucideLogOut,
  LucideScissors,
  LucideUser,
} from '@lucide/angular';

import { AuthService } from '../../core/services/AuthService';

interface MenuItem {
  etiqueta: string;
  ruta: string;
  icono: LucideIcon;
}

const MENU_CLIENTE: readonly MenuItem[] = [
  { etiqueta: 'Inicio', ruta: '/cliente/dashboard', icono: LucideHome },
  { etiqueta: 'Servicios', ruta: '/cliente/servicios', icono: LucideScissors },
  { etiqueta: 'Agendar cita', ruta: '/cliente/agendar-cita', icono: LucideCalendarPlus },
  { etiqueta: 'Mis citas', ruta: '/cliente/mis-citas', icono: LucideListChecks },
  { etiqueta: 'Perfil', ruta: '/cliente/perfil', icono: LucideUser },
];

const MENU_BARBERO: readonly MenuItem[] = [
  { etiqueta: 'Inicio', ruta: '/barbero/barbero-dashboard', icono: LucideHome },
  { etiqueta: 'Agenda', ruta: '/barbero/agenda', icono: LucideCalendarDays },
  { etiqueta: 'Servicios', ruta: '/barbero/servicios-barbero', icono: LucideScissors },
  { etiqueta: 'Reportes', ruta: '/barbero/reportes', icono: LucideChartColumn },
  { etiqueta: 'Perfil', ruta: '/barbero/perfil', icono: LucideUser },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideDynamicIcon, LucideLogOut],
  templateUrl: './app-sidebar.html',
  host: { class: 'contents' },
})
export class AppSidebar {
  private readonly authService = inject(AuthService);

  readonly menuAbierto = input(false);
  readonly cerrarMenu = output<void>();

  readonly menu = computed<readonly MenuItem[]>(() =>
    this.authService.usuario()?.rol.toLowerCase() === 'barbero' ? MENU_BARBERO : MENU_CLIENTE,
  );

  cerrarSesion(): void {
    this.cerrarMenu.emit();
    this.authService.cerrarSesion();
  }
}
