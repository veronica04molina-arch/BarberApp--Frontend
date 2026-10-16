import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Usuario, UsuarioRequest } from '../../models/usuario';
import { LoginRequest } from '../../models/login-request';
import { environment } from '../../../environments/environment';
import { END_POINT_SERVICE } from '../../../environments/environment.variable';

@Injectable({
  providedIn: 'root',
})
export class CrearUsuarioService {
  private readonly loginUrl = `${environment.apiUrl}/${END_POINT_SERVICE.POST_CREATE_USER}`;

  constructor(private http: HttpClient) {}

  registrarUsuario(usuarioRequest: UsuarioRequest): Observable<any> {
    return this.http.post<any>(this.loginUrl, usuarioRequest);
  }
}
