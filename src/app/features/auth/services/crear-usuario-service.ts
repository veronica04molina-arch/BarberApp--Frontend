import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Usuario } from '../../../models/usuario';
import { LoginRequest } from '../../../models/login-request';

@Injectable({
  providedIn: 'root'
})
export class CrearUsuarioService {

  private readonly http = inject(HttpClient);

  private readonly API_URL = 'http://localhost:8081';

  crearUsuario(usuario: Usuario): Observable<Usuario> {
  return this.http.post<Usuario>(
    'http://localhost:8081/usuarios',
    usuario
  );
}
}
