import { Component, OnInit, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { NavigationItem } from '../models/NavigationItem';
import { Subscription } from 'rxjs';

@Component({
  selector: 'sa-table-of-contents',
  templateUrl: './sa-table-of-contents.component.html',
  styleUrls: ['./sa-table-of-contents.component.scss']
})
export class SaTableOfContentsComponent implements OnInit, AfterViewInit, OnChanges {
  href: string = '';

  @Input() primaryMenu: NavigationItem[] = [];
  @Input() secondaryMenu: NavigationItem[] = [];

  navigationItemOnClick(item) {
    document.getElementsByClassName('selected')[0]?.classList.remove('selected');
    item.closest('mat-list-item').className += ' selected';
  }
  private primaryMenuSubscription: Subscription[] = [];
  private secondaryMenuSubscription: Subscription[] = [];
  constructor(private scrollDispatcher: ScrollDispatcher) {}

  ngOnInit() {
    this.href = window.location.pathname;
  }

  ngAfterViewInit() {
    this.primaryMenu.forEach((menuItem) => {
      this.primaryMenuSubscription.push(this.subscribeNavigableMenu(menuItem));
    });
    this.secondaryMenu.forEach((menuItem) => {
      this.secondaryMenuSubscription.push(this.subscribeNavigableMenu(menuItem));
    });

    this.scrollDispatcher.scrolled(25).subscribe((x) => {
      if (x) {
        let scroll_start = x['elementRef'].nativeElement.scrollTop;
        let clientHeight = x['elementRef'].nativeElement.clientHeight;
        let scrollHeight = scroll_start + clientHeight - 66;

        let itemOffsets = this.getItemOffsets();

        for (let i = 0; i < itemOffsets.length; i++) {
          if (scroll_start <= itemOffsets[0].top - 66) {
            this.triggerEvent(itemOffsets[0].route);
          } else if (scrollHeight >= itemOffsets[itemOffsets.length - 1].top) {
            this.triggerEvent(itemOffsets[itemOffsets.length - 1].route);
          } else if (scrollHeight >= itemOffsets[i].top && scrollHeight < itemOffsets[i + 1]?.top) {
            this.triggerEvent(itemOffsets[i].route);
          }
        }}
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.primaryMenu != undefined && changes.primaryMenu != null) {
      if (changes.primaryMenu.previousValue != undefined) {
        changes.primaryMenu.previousValue.forEach((x: NavigationItem) => {
          this.primaryMenuSubscription.forEach((y: Subscription) => {
            y.unsubscribe();
          });
        });
      }

      changes.primaryMenu.currentValue.forEach((x: NavigationItem) => {
        this.primaryMenuSubscription.push(this.subscribeNavigableMenu(x));
      });
    }

    if (changes.secondaryMenu != undefined && changes.secondaryMenu != null) {
      if (changes.secondaryMenu.previousValue != undefined) {
        changes.secondaryMenu.previousValue.forEach((x: NavigationItem) => {
          this.secondaryMenuSubscription.forEach((y: Subscription) => {
            y.unsubscribe();
          });
        });
      }
      changes.secondaryMenu.currentValue.forEach((x: NavigationItem) => {
        this.secondaryMenuSubscription.push(this.subscribeNavigableMenu(x));
      });
    }
  }

  private subscribeNavigableMenu(menuItem: NavigationItem): Subscription {
    return menuItem.obs$.subscribe(function (result) {
      document.getElementsByClassName('selected')[0]?.classList.remove('selected');
      const menuItemElement = document.querySelector('a[href="' + window.location.pathname + '#' + result + '"]');
      menuItemElement.closest('mat-list-item').className += ' selected';
    });
  }

  getItemOffsets() {
    const that = this;
    let itemOffsets = [];
    this.primaryMenu.forEach(function (item) {
      var top = that.getDistanceFromTop(document.querySelector('a[name="' + item.route + '"]'));
      let itemOffset = {
        top: top,
        route: item.route
      };
      itemOffsets.push(itemOffset);
    });
    this.secondaryMenu.forEach(function (item) {
      var top = that.getDistanceFromTop(document.querySelector('a[name="' + item.route + '"]'));
      let itemOffset = {
        top: top,
        route: item.route
      };
      itemOffsets.push(itemOffset);
    });
    return itemOffsets;
  }

  getDistanceFromTop(element) {
    var top = 0;

    while (element) {
      top += element.offsetTop;
      element = element.offsetParent;
    }

    return top;
  }

  triggerEvent(route: string) {
    const menuItem =
      this.primaryMenu.find((x) => x.route === route) || this.secondaryMenu.find((x) => x.route === route);
    menuItem.triggerNext();
  }
}
