import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { END_POINT_SERVICE } from '../../../environments/environment.variable';

export interface ExcepcionHorario {
  id: number;
  idBarbero: number;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  tipo: string;
  motivo: string | null;
}

export interface CrearExcepcionHorario {
  idBarbero: number;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  tipo: string;
  motivo: string | null;
}

export interface ActualizarExcepcionHorario {
  tipo: string;
  motivo: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ExcepcionHorarioService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  obtenerPorBarbero(idBarbero: number): Observable<ExcepcionHorario[]> {
    return this.http.get<ExcepcionHorario[]>(
      `${this.api}/${END_POINT_SERVICE.GET_EXCEPCIONES_HORARIO_BARBERO}/${idBarbero}`,
    );
  }

  crear(excepcion: CrearExcepcionHorario): Observable<ExcepcionHorario> {
    return this.http.post<ExcepcionHorario>(
      `${this.api}/${END_POINT_SERVICE.POST_EXCEPCIONES_HORARIO}`,
      excepcion,
    );
  }

  actualizar(id: number, excepcion: ActualizarExcepcionHorario): Observable<ExcepcionHorario> {
    return this.http.put<ExcepcionHorario>(
      `${this.api}/${END_POINT_SERVICE.PUT_EXCEPCIONES_HORARIO}/${id}`,
      excepcion,
    );
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete(
      `${this.api}/${END_POINT_SERVICE.DELETE_EXCEPCIONES_HORARIO}/${id}`,
      { responseType: 'text' },
    );
  }
}
