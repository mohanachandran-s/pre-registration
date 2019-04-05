import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FaqComponent } from './faq.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpLoaderFactory } from 'src/app/i18n.module';
import { HttpClient } from 'selenium-webdriver/http';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from 'src/app/material.module';
import { DataStorageService } from '../services/data-storage.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

class MockService {
  use() {}
  url = 'some/url/here';
}

let service2: DataStorageService,
  mockService = {
    url: 'some/url/here',
    getSecondaryLanguageLabels: jasmine
      .createSpy('getSecondaryLanguageLabels')
      .and.returnValue(of({ timeSelection: { booking: { label1: 'hello' } } }))
  };

describe('FaqComponent', () => {
  let component: FaqComponent;
  let fixture: ComponentFixture<FaqComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FaqComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        }),
        HttpClientModule,
        MaterialModule
      ],
      providers: [{ provide: DataStorageService, useValue: mockService }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
