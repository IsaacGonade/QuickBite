import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartaService {
  private apiUrl = 'http://localhost:3000/api/carta';

  constructor(private http: HttpClient) { }

  getCarta(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}
