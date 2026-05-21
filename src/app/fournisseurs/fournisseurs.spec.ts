import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fournisseurs } from './fournisseurs';

describe('Fournisseurs', () => {
  let component: Fournisseurs;
  let fixture: ComponentFixture<Fournisseurs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fournisseurs],
    }).compileComponents();

    fixture = TestBed.createComponent(Fournisseurs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
