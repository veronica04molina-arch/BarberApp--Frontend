export interface Notificacion {
  id: number;
  idUsuario: number;
  idCita: number;
  mensaje: string;
  estado: 'pendiente' | 'leida';
  fechaEnvio: string;
}
