import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.local';
import { END_POINT_SERVICE } from '../../../environments/environment.variable';

export interface HorarioSemanal {
  id: number;
  idBarbero: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
}

export interface CrearHorarioSemanal {
  idBarbero: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
}

export interface ActualizarHorarioSemanal {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
}

@Injectable({
  providedIn: 'root',
})
export class HorarioSemanalService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  obtenerPorBarbero(idBarbero: number): Observable<HorarioSemanal[]> {
    return this.http.get<HorarioSemanal[]>(
      `${this.api}/${END_POINT_SERVICE.GET_HORARIOS_SEMANALES_BARBERO}/${idBarbero}`,
    );
  }

  crear(horario: CrearHorarioSemanal): Observable<HorarioSemanal> {
    return this.http.post<HorarioSemanal>(
      `${this.api}/${END_POINT_SERVICE.POST_HORARIOS_SEMANALES}`,
      horario,
    );
  }

  actualizar(id: number, horario: ActualizarHorarioSemanal): Observable<HorarioSemanal> {
    return this.http.put<HorarioSemanal>(
      `${this.api}/${END_POINT_SERVICE.PUT_HORARIOS_SEMANALES}/${id}`,
      horario,
    );
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete(
      `${this.api}/${END_POINT_SERVICE.DELETE_HORARIOS_SEMANALES}/${id}`,
      { responseType: 'text' },
    );
  }
}
