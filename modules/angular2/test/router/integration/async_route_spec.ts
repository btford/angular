import {
  describeRouter,
  ddescribeRouter,
  describeWith,
  describeWithout,
  describeWithAndWithout,
  itShouldRoute
} from './util';

import {registerSpecs} from './impl/async_route_spec_impl';

export function main() {
  registerSpecs();

  ddescribeRouter('async routes', () => {
    describeWithout('children', () => { describeWithAndWithout('params', itShouldRoute); });

    describeWith('sync children',
                 () => { describeWithAndWithout('default routes', itShouldRoute); });

    describeWith('async children', () => {
      describeWithAndWithout('params',
                             () => { describeWithAndWithout('default routes', itShouldRoute); });
    });
  });
}



// import {
//  RootTestComponent,
//  AsyncTestCompleter,
//  TestComponentBuilder,
//  beforeEach,
//  ddescribe,
//  xdescribe,
//  describe,
//  el,
//  expect,
//  iit,
//  inject,
//  beforeEachProviders,
//  it,
//  xit
//} from 'angular2/testing_internal';
//
// import {provide, Component, Injector, Inject} from 'angular2/core';
// import {Promise, PromiseWrapper} from 'angular2/src/core/facade/async';
//
// import {Router, RouterOutlet, RouterLink, RouteParams, RouteData, Location} from
// 'angular2/router';
// import {
//  RouteConfig,
//  Route,
//  AsyncRoute
//} from 'angular2/src/router/route_config_decorator';
//
// import {TEST_ROUTER_PROVIDERS, RootCmp, createCompileHelper} from './util';
//
// var cmpInstanceCount;
// var childCmpInstanceCount;
//
//
//
// export function main() {
//  describe('async routes', () => {
//
//    var tcb: TestComponentBuilder;
//    var rootTC: RootTestComponent;
//    var rtr;
//    var compile;
//
//    beforeEachProviders(() => TEST_ROUTER_PROVIDERS);
//
//    beforeEach(inject([TestComponentBuilder, Router], (tcBuilder, router) => {
//      tcb = tcBuilder;
//      rtr = router;
//      compile = createCompileHelper(tcb, (rtc) => {rootTC = rtc});
//      childCmpInstanceCount = 0;
//      cmpInstanceCount = 0;
//    }));
//
//    it('should navigate to child routes of async routes', inject([AsyncTestCompleter], (async) =>
//    {
//      compile('outer { <router-outlet></router-outlet> }')
//        .then((_) => rtr.config([new AsyncRoute({path: '/a/...', loader: parentLoader})]))
//        .then((_) => rtr.navigateByUrl('/a/b'))
//        .then((_) => {
//          rootTC.detectChanges();
//          expect(rootTC.debugElement.nativeElement).toHaveText('outer { inner { hello } }');
//          async.done();
//        });
//    }));
//
//    // TODO: test for async routes as well?
//    it('should reuse common parent components', inject([AsyncTestCompleter], (async) => {
//      compile()
//        .then((_) => rtr.config([new Route({path: '/team/:id/...', component: TeamCmp})]))
//        .then((_) => rtr.navigateByUrl('/team/angular/user/rado'))
//        .then((_) => {
//          rootTC.detectChanges();
//          expect(cmpInstanceCount).toBe(1);
//          expect(rootTC.debugElement.nativeElement).toHaveText('team angular { hello rado }');
//        })
//        .then((_) => rtr.navigateByUrl('/team/angular/user/victor'))
//        .then((_) => {
//          rootTC.detectChanges();
//          expect(cmpInstanceCount).toBe(1);
//          expect(rootTC.debugElement.nativeElement)
//            .toHaveText('team angular { hello victor }');
//          async.done();
//        });
//    }));
//
//    it('should inject route data into the component',
//      inject([AsyncTestCompleter], (async) => {
//        compile()
//          .then((_) => rtr.config([
//            new AsyncRoute(
//              {path: '/route-data', loader: asyncRouteDataCmp, data: {isAdmin: true}})
//          ]))
//          .then((_) => rtr.navigateByUrl('/route-data'))
//          .then((_) => {
//            rootTC.detectChanges();
//            expect(rootTC.debugElement.nativeElement).toHaveText('true');
//            async.done();
//          });
//      }));
//
//    it('should inject empty object if the route has no data property',
//      inject([AsyncTestCompleter], (async) => {
//        compile()
//          .then((_) => rtr.config(
//            [new AsyncRoute(
//              {path: '/route-data-default', loader: asyncRouteDataCmp})
//            ]))
//          .then((_) => rtr.navigateByUrl('/route-data-default'))
//          .then((_) => {
//            rootTC.detectChanges();
//            expect(rootTC.debugElement.nativeElement).toHaveText('');
//            async.done();
//          });
//      }));
//  });
//}
//
//
//@Component({selector: 'hello-cmp', template: `{{greeting}}`})
// class HelloCmp {
//  greeting: string;
//  constructor() { this.greeting = 'hello'; }
//}
//
//
// function asyncRouteDataCmp() {
//  return PromiseWrapper.resolve(RouteDataCmp);
//}
//
//@Component({selector: 'data-cmp', template: `{{myData}}`})
// class RouteDataCmp {
//  myData: boolean;
//  constructor(data: RouteData) { this.myData = data.get('isAdmin'); }
//}
//
//@Component({selector: 'user-cmp', template: `hello {{user}}`})
// class UserCmp {
//  user: string;
//  constructor(params: RouteParams) {
//    childCmpInstanceCount += 1;
//    this.user = params.get('name');
//  }
//}
//
//
// function parentLoader() {
//  return PromiseWrapper.resolve(ParentCmp);
//}
//
//@Component({
//  selector: 'parent-cmp',
//  template: `inner { <router-outlet></router-outlet> }`,
//  directives: [RouterOutlet],
//})
//@RouteConfig([
//  new Route({path: '/b', component: HelloCmp}),
//  new Route({path: '/', component: HelloCmp}),
//])
// class ParentCmp {
//}
//
//
//@Component({
//  selector: 'team-cmp',
//  template: `team {{id}} { <router-outlet></router-outlet> }`,
//  directives: [RouterOutlet],
//})
//@RouteConfig([new Route({path: '/user/:name', component: UserCmp})])
// class TeamCmp {
//  id: string;
//  constructor(params: RouteParams) {
//    this.id = params.get('id');
//    cmpInstanceCount += 1;
//  }
//}
