/** Angular Imports */
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';

/** rxjs Imports */
import { Subscription } from 'rxjs';

/** Custom Models */
import { Alert } from '../core/alert/alert.model';

/** Custom Services */
import { AlertService } from '../core/alert/alert.service';
import { ThemingService } from '../shared/theme-toggle/theming.service';

/** Environment Imports */
import { environment } from '../../environments/environment';
import { SettingsService } from 'app/settings/settings.service';
import { LanguageSelectorComponent } from '../shared/language-selector/language-selector.component';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle.component';
import { ServerSelectorComponent } from '../shared/server-selector/server-selector.component';
import { TenantSelectorComponent } from '../shared/tenant-selector/tenant-selector.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { TwoFactorAuthenticationComponent } from './two-factor-authentication/two-factor-authentication.component';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { FooterComponent } from '../shared/footer/footer.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { M3IconComponent } from '../shared/m3-ui/m3-icon/m3-icon.component';

/**
 * Login component.
 */
@Component({
  selector: 'mifosx-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    LanguageSelectorComponent,
    ThemeToggleComponent,
    ServerSelectorComponent,
    TenantSelectorComponent,
    LoginFormComponent,
    ResetPasswordComponent,
    TwoFactorAuthenticationComponent,
    MatMenuTrigger,
    FooterComponent,
    FaIconComponent,
    MatMenu,
    MatMenuItem,
    M3IconComponent
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  private alertService = inject(AlertService);
  private settingsService = inject(SettingsService);
  private themingService = inject(ThemingService);
  private router = inject(Router);

  public environment = environment;

  /** True if password requires a reset. */
  resetPassword = false;
  /** True if user requires two factor authentication. */
  twoFactorAuthenticationRequired = false;
  /** Subscription to alerts. */
  alert$: Subscription;
  logoPath = 'assets/images/default_home.png';
  /** Subscription to theme changes. */
  theme$: Subscription;

  themeDarkEnabled: boolean = false;

  /**
   * Subscribes to alert event of alert service and theme changes.
   */
  ngOnInit() {
    this.updateLogo();
    this.themeDarkEnabled = this.settingsService.themeDarkEnabled;
    // Subscribe to theme changes
    this.theme$ = this.themingService.theme.subscribe((value: string) => {
      this.themeDarkEnabled = this.settingsService.themeDarkEnabled;
    });

    // Initialize theme based on settings
    this.themingService.setDarkMode(!!this.settingsService.themeDarkEnabled);

    // Subscribe to alerts
    this.alert$ = this.alertService.alertEvent.subscribe((alertEvent: Alert) => {
      const alertType = alertEvent.type;
      if (alertType === 'Password Expired') {
        this.twoFactorAuthenticationRequired = false;
        this.resetPassword = true;
      } else if (alertType === 'Two Factor Authentication Required') {
        this.resetPassword = false;
        this.twoFactorAuthenticationRequired = true;
      } else if (alertType === 'Authentication Success') {
        this.resetPassword = false;
        this.twoFactorAuthenticationRequired = false;
        this.router.navigate(['/'], { replaceUrl: true });
      } else if (alertType === 'Tenant Changed') {
        this.updateLogo();
      }
    });
  }

  /**
   * Unsubscribes from alerts and theme changes.
   */
  ngOnDestroy() {
    if (this.alert$) {
      this.alert$.unsubscribe();
    }
    if (this.theme$) {
      this.theme$.unsubscribe();
    }
  }

  reloadSettings(): void {
    this.settingsService.setTenantIdentifier('');
    this.settingsService.setTenantIdentifier(environment.fineractPlatformTenantId || 'default');
    this.settingsService.setTenantIdentifiers(environment.fineractPlatformTenantIds.split(','));
    this.settingsService.setServers(environment.baseApiUrls.split(','));
    window.location.reload();
  }

  displayTenantSelector(): boolean {
    // Hide tenant selector when OAuth2 is enabled (tenant is determined by OAuth server)
    if (environment.oauth.enabled) {
      return false;
    }
    return environment.displayTenantSelector === 'false' ? false : true;
  }

  allowServerSwitch(): boolean {
    return environment.allowServerSwitch === 'false' ? false : true;
  }

  updateLogo(): void {
    if (environment.tenantLogoUrl && environment.tenantLogoUrl.trim() !== '') {
      this.logoPath = environment.tenantLogoUrl;
      return;
    }
    const tenant = this.settingsService.tenantIdentifier;
    if (tenant && tenant !== 'default') {
      this.logoPath = `assets/images/${tenant}_home.png`;
    } else {
      this.logoPath = 'assets/images/default_home.png';
    }
  }

  onLogoError(): void {
    this.logoPath = 'assets/images/default_home.png';
  }
}
