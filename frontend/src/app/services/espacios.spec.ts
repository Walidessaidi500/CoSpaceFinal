import { TestBed } from '@angular/core/testing';

import { Espacios } from './espacios';

describe('Espacios', () => {
  let service: Espacios;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Espacios);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
