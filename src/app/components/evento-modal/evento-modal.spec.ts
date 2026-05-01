import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventoModal } from './evento-modal';

describe('EventoModal', () => {
  let component: EventoModal;
  let fixture: ComponentFixture<EventoModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventoModal],
    }).compileComponents();

    fixture = TestBed.createComponent(EventoModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
