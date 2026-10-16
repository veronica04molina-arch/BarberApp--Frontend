import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { END_POINT_SERVICE } from '../../../environments/environment.variable';
import {
  CitaReporte,
  ResumenCitasReporte,
  ServicioMasSolicitado,
} from '../../models/reporte';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  obtenerResumenCitas(): Observable<ResumenCitasReporte> {
    return this.http.get<ResumenCitasReporte>(
      `${this.api}/${END_POINT_SERVICE.GET_REPORTE_RESUMEN_CITAS}`,
    );
  }

  obtenerCitasPorRango(fechaInicio: string, fechaFin: string): Observable<CitaReporte[]> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<CitaReporte[]>(`${this.api}/${END_POINT_SERVICE.GET_REPORTE_CITAS}`, {
      params,
    });
  }

  obtenerServiciosMasSolicitados(): Observable<ServicioMasSolicitado[]> {
    return this.http.get<ServicioMasSolicitado[]>(
      `${this.api}/${END_POINT_SERVICE.GET_REPORTE_SERVICIOS}`,
    );
  }
}
