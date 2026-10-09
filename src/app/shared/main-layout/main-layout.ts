import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppHeader } from '../app-header/app-header';
import { AppSidebar } from '../app-sidebar/app-sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, AppHeader, AppSidebar],
  templateUrl: './main-layout.html',
})
export class MainLayout {}
