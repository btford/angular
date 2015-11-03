import {
  AsyncTestCompleter,
  beforeEach,
  beforeEachProviders,
  expect,
  iit,
  flushMicrotasks,
  inject,
  it,
  TestComponentBuilder,
  RootTestComponent,
  xit,
} from 'angular2/testing_internal';

import {specs, compile, TEST_ROUTER_PROVIDERS, clickOnElement, getHref} from '../util';

import {Router, AsyncRoute, Route, Location} from 'angular2/router';

import {
  HelloCmp,
  helloCmpLoader,
  UserCmp,
  userCmpLoader,
  TeamCmp,
  ParentCmp,
  parentCmpLoader,
  asyncParentCmpLoader,
  asyncDefaultParentCmpLoader,
  ParentWithDefaultCmp,
  parentWithDefaultCmpLoader
} from './fixture_components';

function getLinkElement(rtc: RootTestComponent) {
  return rtc.debugElement.componentViewChildren[0].nativeElement;
}

function asyncRoutesWithoutChildrenWithoutParams() {
  var rootTC;
  var tcb;
  var rtr;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject([TestComponentBuilder, Router], (tcBuilder, router) => {
    tcb = tcBuilder;
    rtr = router;
  }));

  it('should navigate by URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/test', loader: helloCmpLoader, name: 'Hello'})]))
           .then((_) => rtr.navigateByUrl('/test'))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('hello');
             async.done();
           });
     }));

  it('should navigate by link DSL', inject([AsyncTestCompleter], (async) => {
       compile(tcb)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/test', loader: helloCmpLoader, name: 'Hello'})]))
           .then((_) => rtr.navigate(['/Hello']))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('hello');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `<a [router-link]="['Hello']">go to hello</a> | <router-outlet></router-outlet>`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/test', loader: helloCmpLoader, name: 'Hello'})]))
           .then((_) => {
             rootTC.detectChanges();
             expect(getHref(getLinkElement(rootTC))).toEqual('/test');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject([AsyncTestCompleter, Location], (async, location) => {
       compile(tcb, `<a [router-link]="['Hello']">go to hello</a> | <router-outlet></router-outlet>`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/test', loader: helloCmpLoader, name: 'Hello'})]))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('go to hello | ');

             rtr.subscribe((_) => {
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('go to hello | hello');
               expect(location.urlChanges).toEqual(['/test']);
               async.done();
             });

             clickOnElement(getLinkElement(rootTC));
           });
     }));
}


function asyncRoutesWithoutChildrenWithParams() {
  var rootTC;
  var tcb;
  var rtr;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject([TestComponentBuilder, Router], (tcBuilder, router) => {
    tcb = tcBuilder;
    rtr = router;
  }));

  it('should navigate by URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/user/:name', loader: userCmpLoader, name: 'User'})]))
           .then((_) => rtr.navigateByUrl('/user/igor'))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('hello igor');
             async.done();
           });
     }));

  it('should navigate by link DSL', inject([AsyncTestCompleter], (async) => {
       compile(tcb)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new Route({path: '/user/:name', component: UserCmp, name: 'User'})]))
           .then((_) => rtr.navigate(['/User', {name: 'brian'}]))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('hello brian');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `<a [router-link]="['User', {name: 'naomi'}]">greet naomi</a> | <router-outlet></router-outlet>`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/user/:name', loader: userCmpLoader, name: 'User'})]))
           .then((_) => {
             rootTC.detectChanges();
             expect(getHref(getLinkElement(rootTC))).toEqual('/user/naomi');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject([AsyncTestCompleter, Location], (async, location) => {
       compile(tcb, `<a [router-link]="['User', {name: 'naomi'}]">greet naomi</a> | <router-outlet></router-outlet>`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/user/:name', loader: userCmpLoader, name: 'User'})]))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('greet naomi | ');

             rtr.subscribe((_) => {
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('greet naomi | hello naomi');
               expect(location.urlChanges).toEqual(['/user/naomi']);
               async.done();
             });

             clickOnElement(getLinkElement(rootTC));
           });
     }));

  it('should navigate between components with different parameters',
     inject([AsyncTestCompleter], (async) => {
       compile(tcb)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/user/:name', loader: userCmpLoader, name: 'User'})]))
           .then((_) => rtr.navigateByUrl('/user/brian'))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('hello brian');
           })
           .then((_) => rtr.navigateByUrl('/user/igor'))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('hello igor');
             async.done();
           });
     }));
}


function asyncRoutesWithSyncChildrenWithoutDefaultRoutes() {
  var rootTC;
  var tcb;
  var rtr;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject([TestComponentBuilder, Router], (tcBuilder, router) => {
    tcb = tcBuilder;
    rtr = router;
  }));

  it('should navigate by URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/a/...', loader: parentCmpLoader, name: 'Parent'})]))
           .then((_) => rtr.navigateByUrl('/a/b'))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should navigate by link DSL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/a/...', loader: parentCmpLoader, name: 'Parent'})]))
           .then((_) => rtr.navigate(['/Parent', 'Child']))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `<a [router-link]="['Parent']">nav to child</a> | outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/a/...', loader: parentCmpLoader, name: 'Parent'})]))
           .then((_) => {
             rootTC.detectChanges();
             expect(getHref(getLinkElement(rootTC))).toEqual('/a');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject([AsyncTestCompleter, Location], (async, location) => {
       compile(tcb, `<a [router-link]="['Parent', 'Child']">nav to child</a> | outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config(
                     [new AsyncRoute({path: '/a/...', loader: parentCmpLoader, name: 'Parent'})]))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('nav to child | outer {  }');

             rtr.subscribe((_) => {
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement)
                   .toHaveText('nav to child | outer { inner { hello } }');
               expect(location.urlChanges).toEqual(['/a/b']);
               async.done();
             });

             clickOnElement(getLinkElement(rootTC));
           });
     }));
}


function asyncRoutesWithSyncChildrenWithDefaultRoutes() {
  var rootTC;
  var tcb;
  var rtr;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject([TestComponentBuilder, Router], (tcBuilder, router) => {
    tcb = tcBuilder;
    rtr = router;
  }));

  it('should navigate by URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute({path: '/a/...', loader: parentWithDefaultCmpLoader, name: 'Parent'})
           ]))
           .then((_) => rtr.navigateByUrl('/a'))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should navigate by link DSL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute({path: '/a/...', loader: parentWithDefaultCmpLoader, name: 'Parent'})
           ]))
           .then((_) => rtr.navigate(['/Parent']))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `<a [router-link]="['/Parent']">link to inner</a> | outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute({path: '/a/...', loader: parentWithDefaultCmpLoader, name: 'Parent'})
           ]))
           .then((_) => {
             rootTC.detectChanges();
             expect(getHref(getLinkElement(rootTC))).toEqual('/a');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject([AsyncTestCompleter, Location], (async, location) => {
       compile(tcb, `<a [router-link]="['/Parent']">link to inner</a> | outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute({path: '/a/...', loader: parentWithDefaultCmpLoader, name: 'Parent'})
           ]))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('link to inner | outer {  }');

             rtr.subscribe((_) => {
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement)
                   .toHaveText('link to inner | outer { inner { hello } }');
               expect(location.urlChanges).toEqual(['/a/b']);
               async.done();
             });

             clickOnElement(getLinkElement(rootTC));
           });
     }));
}


function asyncRoutesWithAsyncChildrenWithoutParamsWithoutDefaultRoutes() {
  var rootTC;
  var tcb;
  var rtr;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject([TestComponentBuilder, Router], (tcBuilder, router) => {
    tcb = tcBuilder;
    rtr = router;
  }));

  it('should navigate by URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute({path: '/a/...', loader: asyncParentCmpLoader, name: 'Parent'})
           ]))
           .then((_) => rtr.navigateByUrl('/a/b'))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should navigate by link DSL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute({path: '/a/...', loader: asyncParentCmpLoader, name: 'Parent'})
           ]))
           .then((_) => rtr.navigate(['/Parent', 'Child']))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `<a [router-link]="['Parent', 'Child']">nav to child</a> | outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute({path: '/a/...', loader: asyncParentCmpLoader, name: 'Parent'})
           ]))
           .then((_) => {
             rootTC.detectChanges();
             expect(getHref(getLinkElement(rootTC))).toEqual('/a');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject([AsyncTestCompleter, Location], (async, location) => {
       compile(tcb, `<a [router-link]="['Parent', 'Child']">nav to child</a> | outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute({path: '/a/...', loader: asyncParentCmpLoader, name: 'Parent'})
           ]))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('nav to child | outer {  }');

             rtr.subscribe((_) => {
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement)
                   .toHaveText('nav to child | outer { inner { hello } }');
               expect(location.urlChanges).toEqual(['/a/b']);
               async.done();
             });

             clickOnElement(getLinkElement(rootTC));
           });
     }));
}


function asyncRoutesWithAsyncChildrenWithoutParamsWithDefaultRoutes() {
  var rootTC;
  var tcb;
  var rtr;

  beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

  beforeEach(inject([TestComponentBuilder, Router], (tcBuilder, router) => {
    tcb = tcBuilder;
    rtr = router;
  }));

  it('should navigate by URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute(
                 {path: '/a/...', loader: asyncDefaultParentCmpLoader, name: 'Parent'})
           ]))
           .then((_) => rtr.navigateByUrl('/a'))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should navigate by link DSL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute(
                 {path: '/a/...', loader: asyncDefaultParentCmpLoader, name: 'Parent'})
           ]))
           .then((_) => rtr.navigate(['/Parent']))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
             async.done();
           });
     }));

  it('should generate a link URL', inject([AsyncTestCompleter], (async) => {
       compile(tcb, `<a [router-link]="['Parent']">nav to child</a> | outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute(
                 {path: '/a/...', loader: asyncDefaultParentCmpLoader, name: 'Parent'})
           ]))
           .then((_) => {
             rootTC.detectChanges();
             expect(getHref(getLinkElement(rootTC))).toEqual('/a');
             async.done();
           });
     }));

  it('should navigate from a link click',
     inject([AsyncTestCompleter, Location], (async, location) => {
       compile(tcb, `<a [router-link]="['Parent']">nav to child</a> | outer { <router-outlet></router-outlet> }`)
           .then((rtc) => {rootTC = rtc})
           .then((_) => rtr.config([
             new AsyncRoute(
                 {path: '/a/...', loader: asyncDefaultParentCmpLoader, name: 'Parent'})
           ]))
           .then((_) => {
             rootTC.detectChanges();
             expect(rootTC.debugElement.nativeElement).toHaveText('nav to child | outer {  }');

             rtr.subscribe((_) => {
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement)
                   .toHaveText('nav to child | outer { inner { hello } }');
               expect(location.urlChanges).toEqual(['/a/b']);
               async.done();
             });

             clickOnElement(getLinkElement(rootTC));
           });
     }));
}


export function registerSpecs() {
  var noop = () => {};
  specs['asyncRoutesWithoutChildrenWithoutParams'] = asyncRoutesWithoutChildrenWithoutParams;
  specs['asyncRoutesWithoutChildrenWithParams'] = asyncRoutesWithoutChildrenWithParams;
  specs['asyncRoutesWithSyncChildrenWithoutDefaultRoutes'] =
      asyncRoutesWithSyncChildrenWithoutDefaultRoutes;
  specs['asyncRoutesWithSyncChildrenWithDefaultRoutes'] =
      asyncRoutesWithSyncChildrenWithDefaultRoutes;
  specs['asyncRoutesWithAsyncChildrenWithoutParamsWithoutDefaultRoutes'] =
      asyncRoutesWithAsyncChildrenWithoutParamsWithoutDefaultRoutes;
  specs['asyncRoutesWithAsyncChildrenWithoutParamsWithDefaultRoutes'] =
      asyncRoutesWithAsyncChildrenWithoutParamsWithDefaultRoutes;

  // TODO: implement these once default params are implemented
  specs['asyncRoutesWithAsyncChildrenWithParamsWithoutDefaultRoutes'] = noop;
  specs['asyncRoutesWithAsyncChildrenWithParamsWithDefaultRoutes'] = noop;
}
