export interface ResumenCitasReporte {
  totalCitas: number;
  citasPendientes: number;
  citasCompletadas: number;
  citasConfirmadas: number;
  citasCanceladas: number;
}

/** Forma exacta de una cita devuelta por GET /reportes/citas. */
export interface CitaReporte {
  id: number;
  idUsuario: number;
  idBarbero: number;
  fecha: string;
  hora: string;
  estado: string;
}

/** Forma exacta de ReporteServicioDTO devuelta por GET /reportes/servicios. */
export interface ServicioMasSolicitado {
  servicio: string;
  cantidad: number;
}
