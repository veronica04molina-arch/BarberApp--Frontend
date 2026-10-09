import { Location } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideArrowLeft, LucideFileText, LucideShieldCheck } from '@lucide/angular';

import { DocumentoLegal, PRIVACIDAD, TERMINOS } from '../legal-contenido';

type TipoDocumentoLegal = 'privacidad' | 'terminos';

@Component({
  selector: 'app-pagina-legal',
  standalone: true,
  imports: [RouterLink, LucideArrowLeft, LucideFileText, LucideShieldCheck],
  templateUrl: './pagina-legal.html',
})
export class PaginaLegal {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  private readonly datosRuta = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });

  readonly tipo = computed(() => this.datosRuta()['tipo'] as TipoDocumentoLegal);
  readonly documento = computed<DocumentoLegal>(() =>
    this.tipo() === 'terminos' ? TERMINOS : PRIVACIDAD,
  );
  readonly esPrivacidad = computed(() => this.tipo() === 'privacidad');
  readonly otraRuta = computed(() => (this.esPrivacidad() ? '/terminos' : '/privacidad'));
  readonly otraEtiqueta = computed(() =>
    this.esPrivacidad() ? 'Términos y condiciones' : 'Política de privacidad',
  );

  volver(): void {
    const navigationId = (
      this.location.getState() as { navigationId?: number } | null
    )?.navigationId;

    if (navigationId && navigationId > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/login');
  }
}
