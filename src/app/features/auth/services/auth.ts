import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Usuario } from '../../../models/usuario';
import { LoginRequest } from '../../../models/login-request';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly API_URL = 'http://localhost:8081';

  iniciarSesion(
    credenciales: LoginRequest
  ): Observable<Usuario> {

    return this.http.post<Usuario>(
      `${this.API_URL}/login`,
      credenciales
    );
  }
}
