import { TestBed } from '@angular/core/testing';
import { ProfileService } from './profile.service'; // ✅ Correction du nom importé

describe('ProfileService', () => { // ✅ Correction du nom du describe
  let service: ProfileService; // ✅ Correction du type

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfileService); // ✅ Correction de l'injection
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});