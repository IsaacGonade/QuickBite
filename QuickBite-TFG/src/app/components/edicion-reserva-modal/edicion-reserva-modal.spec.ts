import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdicionReservaModal } from './edicion-reserva-modal';

describe('EdicionReservaModal', () => {
  let component: EdicionReservaModal;
  let fixture: ComponentFixture<EdicionReservaModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdicionReservaModal],
    }).compileComponents();

    fixture = TestBed.createComponent(EdicionReservaModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
