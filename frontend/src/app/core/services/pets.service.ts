import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  gender?: string;
  size?: string;
  color?: string;
  weight?: number;
  description?: string;
  location?: string;
  status: string;
  primaryImage?: string;
  images?: PetImage[];
  ong?: ONG;
  createdAt: string;
}

export interface PetImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ONG {
  id: string;
  ongName: string;
  email: string;
  phone?: string;
  instagramHandle?: string;
  location?: string;
  distance?: string;
  rating?: number;
}

export interface SearchPetsParams {
  location?: string;
  species?: string;
  size?: string;
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  page?: number;
  limit?: number;
}

export interface PetsResponse {
  data: Pet[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PetsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pets`;

  searchPets(params: SearchPetsParams): Observable<PetsResponse> {
    let httpParams = new HttpParams();

    Object.keys(params).forEach((key) => {
      const value = params[key as keyof SearchPetsParams];
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<PetsResponse>(this.apiUrl, { params: httpParams });
  }

  getPetById(id: string): Observable<Pet> {
    return this.http.get<Pet>(`${this.apiUrl}/${id}`);
  }

  createPet(petData: FormData): Observable<Pet> {
    return this.http.post<Pet>(this.apiUrl, petData);
  }

  updatePet(id: string, petData: Partial<Pet>): Observable<Pet> {
    return this.http.put<Pet>(`${this.apiUrl}/${id}`, petData);
  }

  deletePet(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  getCitiesWithPets(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/cities`);
  }
}
