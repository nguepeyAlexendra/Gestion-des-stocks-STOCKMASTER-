import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntreesStock } from './entrees-stock';

describe('EntreesStock', () => {
  let component: EntreesStock;
  let fixture: ComponentFixture<EntreesStock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntreesStock],
    }).compileComponents();

    fixture = TestBed.createComponent(EntreesStock);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
