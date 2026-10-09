export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  telefono: string;
  fechaRegistro: Date;
}

export interface UsuarioRequest {
  id?: number;
  nombre: string;
  email: string;
  rol?: string;
  password: string;
  telefono: string;
  fechaRegistro?: Date;
}
