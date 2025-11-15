import {
  Directive,
  ElementRef,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';

/**
 * Pull-to-refresh directive for mobile devices
 *
 * Usage:
 * <div appPullToRefresh (refresh)="onRefresh()">
 *   <!-- content -->
 * </div>
 *
 * Features:
 * - Detects pull gesture on touch devices
 * - Shows visual feedback during pull
 * - Emits refresh event when threshold is reached
 * - Only works when scrolled to top
 */
@Directive({
  selector: '[appPullToRefresh]',
  standalone: true,
})
export class PullToRefreshDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Output() refresh = new EventEmitter<() => void>();

  private touchStartY = 0;
  private touchCurrentY = 0;
  private isPulling = false;
  private pullThreshold = 80; // pixels to pull before triggering refresh
  private refreshIndicator?: HTMLElement;
  private isRefreshing = false;

  private listeners: (() => void)[] = [];

  ngOnInit(): void {
    this.createRefreshIndicator();
    this.attachListeners();
  }

  ngOnDestroy(): void {
    this.removeRefreshIndicator();
    this.removeListeners();
  }

  private createRefreshIndicator(): void {
    // Create refresh indicator element
    this.refreshIndicator = this.renderer.createElement('div');
    this.renderer.addClass(this.refreshIndicator, 'pull-to-refresh-indicator');
    this.renderer.setStyle(this.refreshIndicator, 'position', 'absolute');
    this.renderer.setStyle(this.refreshIndicator, 'top', '-60px');
    this.renderer.setStyle(this.refreshIndicator, 'left', '50%');
    this.renderer.setStyle(this.refreshIndicator, 'transform', 'translateX(-50%)');
    this.renderer.setStyle(this.refreshIndicator, 'width', '40px');
    this.renderer.setStyle(this.refreshIndicator, 'height', '40px');
    this.renderer.setStyle(this.refreshIndicator, 'display', 'flex');
    this.renderer.setStyle(this.refreshIndicator, 'align-items', 'center');
    this.renderer.setStyle(this.refreshIndicator, 'justify-content', 'center');
    this.renderer.setStyle(this.refreshIndicator, 'opacity', '0');
    this.renderer.setStyle(this.refreshIndicator, 'transition', 'opacity 0.2s');
    this.renderer.setStyle(this.refreshIndicator, 'pointer-events', 'none');
    this.renderer.setStyle(this.refreshIndicator, 'z-index', '1000');

    // Create spinner SVG
    const spinner = this.renderer.createElement('svg', 'svg');
    this.renderer.setAttribute(spinner, 'width', '32');
    this.renderer.setAttribute(spinner, 'height', '32');
    this.renderer.setAttribute(spinner, 'viewBox', '0 0 24 24');
    this.renderer.setAttribute(spinner, 'fill', 'none');
    this.renderer.setStyle(spinner, 'color', '#5CB5B0');

    const circle = this.renderer.createElement('circle', 'svg');
    this.renderer.setAttribute(circle, 'cx', '12');
    this.renderer.setAttribute(circle, 'cy', '12');
    this.renderer.setAttribute(circle, 'r', '10');
    this.renderer.setAttribute(circle, 'stroke', 'currentColor');
    this.renderer.setAttribute(circle, 'stroke-width', '3');
    this.renderer.setAttribute(circle, 'stroke-linecap', 'round');
    this.renderer.setAttribute(circle, 'stroke-dasharray', '60');
    this.renderer.setAttribute(circle, 'stroke-dashoffset', '0');

    this.renderer.appendChild(spinner, circle);
    this.renderer.appendChild(this.refreshIndicator, spinner);

    // Make parent container position relative if it's not already
    const parentPosition = window.getComputedStyle(this.el.nativeElement).position;
    if (parentPosition === 'static') {
      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    }

    this.renderer.appendChild(this.el.nativeElement, this.refreshIndicator);
  }

  private removeRefreshIndicator(): void {
    if (this.refreshIndicator) {
      this.renderer.removeChild(this.el.nativeElement, this.refreshIndicator);
    }
  }

  private attachListeners(): void {
    const touchStartListener = this.renderer.listen(
      this.el.nativeElement,
      'touchstart',
      (e: TouchEvent) => this.onTouchStart(e)
    );

    const touchMoveListener = this.renderer.listen(
      this.el.nativeElement,
      'touchmove',
      (e: TouchEvent) => this.onTouchMove(e)
    );

    const touchEndListener = this.renderer.listen(
      this.el.nativeElement,
      'touchend',
      () => this.onTouchEnd()
    );

    this.listeners.push(touchStartListener, touchMoveListener, touchEndListener);
  }

  private removeListeners(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners = [];
  }

  private onTouchStart(event: TouchEvent): void {
    // Only allow pull-to-refresh when scrolled to the top
    const scrollTop = this.el.nativeElement.scrollTop || window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop === 0) {
      this.touchStartY = event.touches[0].clientY;
      this.isPulling = true;
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.isPulling) return;

    this.touchCurrentY = event.touches[0].clientY;
    const pullDistance = this.touchCurrentY - this.touchStartY;

    // Only process downward pulls
    if (pullDistance > 0) {
      // Show indicator with opacity based on pull distance
      const opacity = Math.min(pullDistance / this.pullThreshold, 1);
      if (this.refreshIndicator) {
        this.renderer.setStyle(this.refreshIndicator, 'opacity', opacity.toString());
        this.renderer.setStyle(
          this.refreshIndicator,
          'top',
          `${-60 + pullDistance * 0.5}px`
        );

        // Add rotation animation when threshold is reached
        if (pullDistance >= this.pullThreshold) {
          const rotation = (pullDistance - this.pullThreshold) * 2;
          this.renderer.setStyle(
            this.refreshIndicator.querySelector('svg'),
            'transform',
            `rotate(${rotation}deg)`
          );
        }
      }

      // Prevent scroll when pulling
      if (pullDistance > 10) {
        event.preventDefault();
      }
    }
  }

  private onTouchEnd(): void {
    if (!this.isPulling) return;

    const pullDistance = this.touchCurrentY - this.touchStartY;

    // Trigger refresh if threshold is reached
    if (pullDistance >= this.pullThreshold) {
      this.triggerRefresh();
    } else {
      this.resetIndicator();
    }

    this.isPulling = false;
    this.touchStartY = 0;
    this.touchCurrentY = 0;
  }

  private triggerRefresh(): void {
    if (!this.refreshIndicator || this.isRefreshing) return;

    this.isRefreshing = true;

    // Show spinning animation
    this.renderer.setStyle(this.refreshIndicator, 'opacity', '1');
    this.renderer.setStyle(this.refreshIndicator, 'top', '10px');

    const svg = this.refreshIndicator.querySelector('svg');
    if (svg) {
      this.renderer.addClass(svg, 'spinning');
      this.renderer.setStyle(svg, 'animation', 'spin 1s linear infinite');

      // Add keyframes if not already present
      if (!document.getElementById('pull-to-refresh-keyframes')) {
        const style = this.renderer.createElement('style');
        this.renderer.setAttribute(style, 'id', 'pull-to-refresh-keyframes');
        const keyframes = `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `;
        this.renderer.appendChild(style, this.renderer.createText(keyframes));
        this.renderer.appendChild(document.head, style);
      }
    }

    // Emit refresh event with completion callback
    const completeCallback = () => {
      this.isRefreshing = false;
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        this.resetIndicator();
      }, 300);
    };

    this.refresh.emit(completeCallback);
  }

  private resetIndicator(): void {
    if (!this.refreshIndicator) return;

    this.renderer.setStyle(this.refreshIndicator, 'opacity', '0');
    this.renderer.setStyle(this.refreshIndicator, 'top', '-60px');

    const svg = this.refreshIndicator.querySelector('svg');
    if (svg) {
      this.renderer.removeClass(svg, 'spinning');
      this.renderer.setStyle(svg, 'animation', 'none');
      this.renderer.setStyle(svg, 'transform', 'rotate(0deg)');
    }
  }
}
