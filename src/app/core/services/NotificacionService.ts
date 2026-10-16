import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Notificacion } from '../../models/notificacion';
import { END_POINT_SERVICE } from '../../../environments/environment.variable';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificacionService {
  private readonly http = inject(HttpClient);

  listarPorUsuario(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(
      `${environment.apiUrl}/${END_POINT_SERVICE.GET_NOTIFICACIONES_USUARIO}/${idUsuario}`,
    );
  }

  marcarComoLeida(id: number): Observable<Notificacion> {
    return this.http.put<Notificacion>(
      `${environment.apiUrl}/${END_POINT_SERVICE.PUT_MARCAR_NOTIFICACION_LEIDA}/${id}/leer`,
      {},
    );
  }

  contarPendientes(idUsuario: number): Observable<number> {
    return this.http.get<number>(
      `${environment.apiUrl}/${END_POINT_SERVICE.GET_CANTIDAD_NOTIFICACIONES_PENDIENTES}/${idUsuario}/pendientes`,
    );
  }

  marcarTodasComoLeidas(idUsuario: number): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/${END_POINT_SERVICE.GET_NOTIFICACIONES_USUARIO}/${idUsuario}/leer-todas`,
      {},
    );
  }
}
