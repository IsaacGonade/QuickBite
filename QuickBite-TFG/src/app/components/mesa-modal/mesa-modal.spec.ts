import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesaModal } from './mesa-modal';

describe('MesaModal', () => {
  let component: MesaModal;
  let fixture: ComponentFixture<MesaModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesaModal],
    }).compileComponents();

    fixture = TestBed.createComponent(MesaModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
