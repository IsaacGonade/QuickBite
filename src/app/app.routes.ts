import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Menu } from './components/menu/menu';
import { Reservas } from './components/reservas/reservas';
import { LoginComponent } from './components/login/login';
import { Registro } from './components/registro/registro';
import { Admin } from './components/admin/admin';

export const routes: Routes = [
  { path: '', component: Home}, 
  { path: 'carta', component: Menu },
  { path: 'reservas', component: Reservas },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: Admin },
  { path: 'registro', component: Registro },
  { path: '**', redirectTo: '' } //Redirigir a inicio si la ruta no existe
];