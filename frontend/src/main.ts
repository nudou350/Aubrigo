import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { provideHttpClient, withInterceptors, HttpClient } from "@angular/common/http";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideServiceWorker } from "@angular/service-worker";
import { isDevMode, importProvidersFrom } from "@angular/core";
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";
import { authInterceptor } from "./app/core/interceptors/auth.interceptor";

// Translation loader factory
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: "top",
        anchorScrolling: "enabled",
      })
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:1000",
    }),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'pt',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    ),
  ],
});
