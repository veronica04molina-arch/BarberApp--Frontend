import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.local';
import { Barbero, Servicio } from '../../models/servicio';
import { END_POINT_SERVICE } from '../../../environments/environment.variable';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}`;

  getBarberos() {
    return this.http.get<Barbero[]>(`${this.api}/${END_POINT_SERVICE.GET_BARBEROS}`);
  }

  getServiciosActivos() {
    return this.http.get<Servicio[]>(`${this.api}/${END_POINT_SERVICE.GET_SERVICIOS}`);
  }

  getMisServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.api}/${END_POINT_SERVICE.GET_MIS_SERVICIOS}`);
  }

  crearServicio(datos: Omit<Servicio, 'id' | 'idBarbero' | 'estado'>): Observable<Servicio> {
    return this.http.post<Servicio>(`${this.api}/${END_POINT_SERVICE.POST_SERVICIO}`, datos);
  }

  actualizarServicio(id: number, servicio: Servicio): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.api}/${END_POINT_SERVICE.PUT_SERVICIO}/${id}`, servicio);
  }

  activarServicio(id: number): Observable<void> {
    return this.http.put<void>(`${this.api}/${END_POINT_SERVICE.PUT_ACTIVAR_SERVICIO}/${id}/activar`, null);
  }

  desactivarServicio(id: number): Observable<void> {
    return this.http.put<void>(`${this.api}/${END_POINT_SERVICE.PUT_DESACTIVAR_SERVICIO}/${id}/desactivar`, null);
  }
}
