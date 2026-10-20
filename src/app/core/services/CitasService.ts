import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { END_POINT_SERVICE } from '../../../environments/environment.variable';

import {
  BarberoCita,
  Cita,
  CitaCliente,
  ElegibilidadCompletarCita,
  CitaRequest,
  CitaServicio,
  UsuarioCita,
} from '../../models/cita';
import { Servicio } from '../../models/servicio';

@Injectable({
  providedIn: 'root',
})
export class CitasService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  // DISPONIBILIDAD
  obtenerHorariosDisponibles(
    idBarbero: number,
    fecha: string,
    duracion: number,
    idCitaIgnorar?: number,
  ): Observable<string[]> {
    let params = new HttpParams().set('duracion', duracion);
    if (idCitaIgnorar !== undefined) {
      params = params.set('idCitaIgnorar', idCitaIgnorar);
    }

    const url =
      `${this.api}/${END_POINT_SERVICE.GET_HORARIOS_DISPONIBLES}` +
      `/${idBarbero}/fecha/${fecha}`;

    return this.http.get<string[]>(url, { params });
  }

  // CITAS
  crearCita(request: CitaRequest): Observable<Cita> {
    return this.http.post<Cita>(
      `${this.api}/${END_POINT_SERVICE.POST_CITA}`,
      request
    );
  }

  obtenerCitasCliente(idUsuario: number): Observable<CitaCliente[]> {
    const url =
      `${this.api}/${END_POINT_SERVICE.GET_CITAS_USUARIO}/${idUsuario}`;

    return this.http.get<CitaCliente[]>(url);
  }

  obtenerProximaCita(
    idUsuario: number
  ): Observable<CitaCliente | null> {
    const url =
      `${this.api}/${END_POINT_SERVICE.GET_PROXIMA_CITA}/${idUsuario}/proxima`;

    return this.http.get<CitaCliente | null>(url);
  }

  cancelarCita(
    idCita: number,
    idUsuario: number
  ): Observable<string> {
    const params = new HttpParams().set(
      'idUsuario',
      idUsuario.toString()
    );

    const url =
      `${this.api}/${END_POINT_SERVICE.PUT_CANCELAR_CITA}/${idCita}/cancelar`;

    return this.http.put(url, null, {
      params,
      responseType: 'text',
    });
  }

  actualizarCita(
    idCita: number,
    cita: Cita
  ): Observable<Cita> {
    const url =
      `${this.api}/${END_POINT_SERVICE.PUT_CITA}/${idCita}`;

    return this.http.put<Cita>(url, cita);
  }

  obtenerBarberos(): Observable<BarberoCita[]> {
    return this.http.get<BarberoCita[]>(
      `${this.api}/${END_POINT_SERVICE.GET_BARBEROS_TODOS}`,
    );
  }

  obtenerCitasBarbero(idBarbero: number): Observable<Cita[]> {
    return this.http.get<Cita[]>(
      `${this.api}/${END_POINT_SERVICE.GET_CITAS_BARBERO}/${idBarbero}`,
    );
  }

  obtenerCitasBarberoPorFecha(idBarbero: number, fecha: string): Observable<Cita[]> {
    return this.http.get<Cita[]>(
      `${this.api}/${END_POINT_SERVICE.GET_CITAS_BARBERO}/${idBarbero}/fecha/${fecha}`,
    );
  }

  obtenerCita(idCita: number): Observable<Cita> {
    return this.http.get<Cita>(`${this.api}/${END_POINT_SERVICE.GET_CITA}/${idCita}`);
  }

  obtenerUsuario(idUsuario: number): Observable<UsuarioCita | null> {
    return this.http.get<UsuarioCita | null>(
      `${this.api}/${END_POINT_SERVICE.GET_USUARIO}/${idUsuario}`,
    );
  }

  obtenerServiciosDeCita(idCita: number): Observable<CitaServicio[]> {
    return this.http.get<CitaServicio[]>(
      `${this.api}/${END_POINT_SERVICE.GET_CITA_SERVICIOS}/${idCita}`,
    );
  }

  obtenerServicio(idServicio: number): Observable<Servicio> {
    return this.http.get<Servicio>(
      `${this.api}/${END_POINT_SERVICE.GET_SERVICIO}/${idServicio}`,
    );
  }

  completarCita(idCita: number): Observable<string> {
    return this.http.put(
      `${this.api}/${END_POINT_SERVICE.PUT_COMPLETAR_CITA}/${idCita}/completar`,
      null,
      { responseType: 'text' },
    );
  }

  obtenerElegibilidadCompletar(idCita: number): Observable<ElegibilidadCompletarCita> {
    return this.http.get<ElegibilidadCompletarCita>(
      `${this.api}/${END_POINT_SERVICE.GET_CITA}/${idCita}/completar/elegibilidad`,
    );
  }
}
