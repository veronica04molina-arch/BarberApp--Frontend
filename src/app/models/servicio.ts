export interface Barbero {
  id: number;
  nombre: string;
  especialidad: string;
  experiencia: number | null;
}

export interface Servicio {
  id: number;
  idBarbero: number;
  nombre: string;
  precio: number;
  duracion: number; // minutos
  descripcion: string;
  estado: 'activo' | 'inactivo';
}
