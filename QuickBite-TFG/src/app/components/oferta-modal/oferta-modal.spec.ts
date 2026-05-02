import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfertaModal } from './oferta-modal';

describe('OfertaModal', () => {
  let component: OfertaModal;
  let fixture: ComponentFixture<OfertaModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfertaModal],
    }).compileComponents();

    fixture = TestBed.createComponent(OfertaModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
