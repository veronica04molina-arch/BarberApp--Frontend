export interface CitaRequest {
  idUsuario: number;
  idBarbero: number;
  idServicios: number[];
  fecha: string;
  hora: string;
  notas: string;
}

export interface Cita {
  id: number;
  idUsuario: number;
  idBarbero: number;
  fecha: string;
  hora: string;
  estado: string;
  fechaCreacion: string | null;
  notas: string | null;
}

export interface ElegibilidadCompletarCita {
  puedeCompletar: boolean;
  motivo: string | null;
}

export interface CitaCliente {
  id: number;
  fecha: string;
  hora: string;
  servicios: string[];
  nombreBarbero: string;
  estado: string;
  notas: string | null;
}

export interface CitaServicio {
  id: number;
  idCita: number;
  idServicio: number;
  precioAplicado: number;
  descripcionAplicada: string | null;
}

export interface UsuarioCita {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  telefono: string;
  fechaRegistro: string | null;
}

export interface BarberoCita {
  id: number;
  usuario: UsuarioCita;
  especialidad: string;
  experiencia: number | null;
  estado: string;
}
