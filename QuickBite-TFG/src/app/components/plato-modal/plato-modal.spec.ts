import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatoModal } from './plato-modal';

describe('PlatoModal', () => {
  let component: PlatoModal;
  let fixture: ComponentFixture<PlatoModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatoModal],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatoModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
