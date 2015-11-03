import {PathMatch, RedirectMatch, Match} from './route_recognizer';
import {ComponentRecognizer} from './component_recognizer';
import {
  Instruction,
  ResolvedInstruction,
  UnresolvedInstruction,
  UnresolvedRedirectInstruction,
  ComponentInstruction,
  DefaultInstruction
} from './instruction';
import {ListWrapper, Map, MapWrapper, StringMapWrapper} from 'angular2/src/facade/collection';
import {Promise, PromiseWrapper} from 'angular2/src/facade/async';
import {
  isPresent,
  isArray,
  isBlank,
  isType,
  isString,
  isStringMap,
  isFunction,
  StringWrapper,
  Type,
  getTypeNameForDebugging
} from 'angular2/src/facade/lang';
import {BaseException, WrappedException} from 'angular2/src/facade/exceptions';
import {
  RouteConfig,
  AsyncRoute,
  Route,
  AuxRoute,
  Redirect,
  RouteDefinition
} from './route_config_impl';
import {reflector} from 'angular2/src/core/reflection/reflection';
import {Injectable} from 'angular2/angular2';
import {normalizeRouteConfig, assertComponentExists} from './route_config_nomalizer';
import {parser, Url, pathSegmentsToUrl} from './url_parser';

var _resolveToNull = PromiseWrapper.resolve(null);

/**
 * The RouteRegistry holds route configurations for each component in an Angular app.
 * It is responsible for creating Instructions from URLs, and generating URLs based on route and
 * parameters.
 */
@Injectable()
export class RouteRegistry {
  private _rules = new Map<any, ComponentRecognizer>();

  /**
   * Given a component and a configuration object, add the route to this registry
   */
  config(parentComponent: any, config: RouteDefinition): void {
    config = normalizeRouteConfig(config);

    // this is here because Dart type guard reasons
    if (config instanceof Route) {
      assertComponentExists(config.component, config.path);
    } else if (config instanceof AuxRoute) {
      assertComponentExists(config.component, config.path);
    }

    if (config instanceof AsyncRoute) {
      var loader = config.loader;
      config.loader = () => {
        return loader().then((componentType) => {
          this.configFromComponent(componentType);
          return componentType;
        });
      };
    }

    var recognizer: ComponentRecognizer = this._rules.get(parentComponent);

    if (isBlank(recognizer)) {
      recognizer = new ComponentRecognizer();
      this._rules.set(parentComponent, recognizer);
    }

    var terminal = recognizer.config(config);

    if (config instanceof Route) {
      if (terminal) {
        assertTerminalComponent(config.component, config.path);
      } else {
        this.configFromComponent(config.component);
      }
    }
  }

  /**
   * Reads the annotations of a component and configures the registry based on them
   */
  configFromComponent(component: any): void {
    if (!isType(component)) {
      return;
    }

    // Don't read the annotations from a type more than once –
    // this prevents an infinite loop if a component routes recursively.
    if (this._rules.has(component)) {
      return;
    }
    var annotations = reflector.annotations(component);
    if (isPresent(annotations)) {
      for (var i = 0; i < annotations.length; i++) {
        var annotation = annotations[i];

        if (annotation instanceof RouteConfig) {
          let routeCfgs: RouteDefinition[] = annotation.configs;
          routeCfgs.forEach(config => this.config(component, config));
        }
      }
    }
  }


  /**
   * Given a URL and a parent component, return the most specific instruction for navigating
   * the application into the state specified by the url
   */
  recognize(url: string, parentComponent: any): Promise<Instruction> {
    var parsedUrl = parser.parse(url);
    return this._recognize(parsedUrl, parentComponent);
  }


  /**
   * Recognizes all parent-child routes, but creates unresolved auxiliary routes
   */
  _recognize(parsedUrl: Url, parentComponent, _aux = false): Promise<Instruction> {
    var componentRecognizer = this._rules.get(parentComponent);
    if (isBlank(componentRecognizer)) {
      return _resolveToNull;
    }

    // Matches some beginning part of the given URL
    var possibleMatches: Promise<Match>[] = _aux ?
                                                componentRecognizer.recognizeAuxiliary(parsedUrl) :
                                                componentRecognizer.recognize(parsedUrl);

    var matchPromises: Promise<Instruction>[] =
        possibleMatches.map((candidate: Promise<Match>) => candidate.then((candidate: Match) => {

          if (candidate instanceof PathMatch) {
            if (candidate.instruction.terminal) {
              var unresolvedAux =
                  this._auxRoutesToUnresolved(candidate.remainingAux, parentComponent);
              return new ResolvedInstruction(candidate.instruction, null, unresolvedAux);
            }

            return this._recognize(candidate.remaining, candidate.instruction.componentType)
                .then((childInstruction) => {
                  if (isBlank(childInstruction)) {
                    return null;
                  }
                  var unresolvedAux =
                      this._auxRoutesToUnresolved(candidate.remainingAux, parentComponent);
                  return new ResolvedInstruction(candidate.instruction, childInstruction,
                                                 unresolvedAux);
                })
          }

          if (candidate instanceof RedirectMatch) {
            // TODO: need to account for relative routes
            return this._generate(candidate.redirectTo, parentComponent);
          }
        }));

    if ((isBlank(parsedUrl) || parsedUrl.path == '') && possibleMatches.length == 0) {
      return PromiseWrapper.resolve(this.generateDefault(parentComponent));
    }

    return PromiseWrapper.all(matchPromises).then(mostSpecific);
  }

  private _auxRoutesToUnresolved(auxRoutes: Url[], parentComponent): {[key: string]: Instruction} {
    var unresolvedAuxInstructions: {[key: string]: Instruction} = {};

    auxRoutes.forEach((auxUrl: Url) => {
      unresolvedAuxInstructions[auxUrl.path] = new UnresolvedInstruction(
          () => { return this._recognize(auxUrl, parentComponent, true); });
    });

    return unresolvedAuxInstructions;
  }


  /**
   * Given a normalized list with component names and params like: `['user', {id: 3 }]`
   * generates a url with a leading slash relative to the provided `parentComponent`.
   *
   * If the optional param `_aux` is `true`, then we generate starting at an auxiliary
   * route boundary.
   */
  generate(linkParams: any[], parentComponent: any, _aux = false): Instruction {
    let routeName = linkParams[0];

    // TODO: this is kind of odd but it makes existing assertions pass
    if (isBlank(parentComponent)) {
      throw new BaseException(`Could not find route named "${routeName}".`);
    }

    if (!isString(routeName)) {
      throw new BaseException(`Unexpected segment "${routeName}" in link DSL. Expected a string.`);
    } else if (routeName == '' || routeName == '.' || routeName == '..') {
      throw new BaseException(`"${routeName}/" is only allowed at the beginning of a link DSL.`);
    }

    return this._generate(linkParams, parentComponent, _aux);
  }


  /*
   * Internal helper that does not make any assertions about the beginning of the link DSL
   */
  private _generate(linkParams: any[], parentComponent: any, _aux = false): Instruction {
    if (linkParams.length == 0) {
      return this.generateDefault(parentComponent);
    }
    let linkIndex = 0;
    let routeName = linkParams[linkIndex];

    let params = {};
    if (linkIndex + 1 < linkParams.length) {
      let nextSegment = linkParams[linkIndex + 1];
      if (isStringMap(nextSegment) && !isArray(nextSegment)) {
        params = nextSegment;
        linkIndex += 1;
      }
    }

    let auxInstructions: {[key: string]: Instruction} = {};
    var nextSegment;
    while (linkIndex + 1 < linkParams.length && isArray(nextSegment = linkParams[linkIndex + 1])) {
      let auxInstruction = this.generate(nextSegment, parentComponent, true);

      // TODO: this will not work for aux routes with parameters or multiple segments
      auxInstructions[auxInstruction.component.urlPath] = auxInstruction;
      linkIndex += 1;
    }

    var componentRecognizer = this._rules.get(parentComponent);
    if (isBlank(componentRecognizer)) {
      throw new BaseException(
          `Component "${getTypeNameForDebugging(parentComponent)}" has no route config.`);
    }

    var routeRecognizer =
        (_aux ? componentRecognizer.auxNames : componentRecognizer.names).get(routeName);

    if (!isPresent(routeRecognizer)) {
      throw new BaseException(
          `Component "${getTypeNameForDebugging(parentComponent)}" has no route named "${routeName}".`);
    }

    if (!isPresent(routeRecognizer.handler.componentType)) {
      var compInstruction = routeRecognizer.generateStrings(params);
      return new UnresolvedInstruction(() => {
        return routeRecognizer.handler.resolveComponentType().then(
            () => { return this._generate(linkParams, parentComponent, _aux); });
      }, compInstruction.urlPath, compInstruction.urlParams);
    }

    var componentInstruction = _aux ? componentRecognizer.generateAuxiliary(routeName, params) :
                                      componentRecognizer.generate(routeName, params);


    var childInstruction: Instruction = null;

    var remaining = linkParams.slice(linkIndex + 1);

    // the component is sync
    if (isPresent(componentInstruction.componentType)) {
      if (linkIndex + 1 < linkParams.length) {
        childInstruction = this.generate(remaining, componentInstruction.componentType);
      } else if (!componentInstruction.terminal) {
        // ... look for defaults
        childInstruction = this.generateDefault(componentInstruction.componentType);

        if (isBlank(childInstruction)) {
          throw new BaseException(
              `Link "${ListWrapper.toJSON(linkParams)}" does not resolve to a terminal instruction.`);
        }
      }
    }

    return new ResolvedInstruction(componentInstruction, childInstruction, auxInstructions);
  }

  public hasRoute(name: string, parentComponent: any): boolean {
    var componentRecognizer: ComponentRecognizer = this._rules.get(parentComponent);
    if (isBlank(componentRecognizer)) {
      return false;
    }
    return componentRecognizer.hasRoute(name);
  }

  public generateDefault(componentCursor: Type): DefaultInstruction {
    if (isBlank(componentCursor)) {
      return null;
    }

    var componentRecognizer = this._rules.get(componentCursor);
    if (isBlank(componentRecognizer) || isBlank(componentRecognizer.defaultRoute)) {
      return null;
    }


    var defaultChild = null;
    if (isPresent(componentRecognizer.defaultRoute.handler.componentType)) {
      var componentInstruction = componentRecognizer.defaultRoute.generate({});
      if (!componentRecognizer.defaultRoute.terminal) {
        defaultChild = this.generateDefault(componentRecognizer.defaultRoute.handler.componentType);
      }
      return new DefaultInstruction(componentInstruction, defaultChild);
    }

    return new UnresolvedInstruction(() => {
      return componentRecognizer.defaultRoute.handler.resolveComponentType().then(
          () => this.generateDefault(componentCursor));
    });
  }
}


/*
 * Given a list of instructions, returns the most specific instruction
 */
function mostSpecific(instructions: Instruction[]): Instruction {
  return ListWrapper.maximum(instructions, (instruction: Instruction) => instruction.specificity);
}

function assertTerminalComponent(component, path) {
  if (!isType(component)) {
    return;
  }

  var annotations = reflector.annotations(component);
  if (isPresent(annotations)) {
    for (var i = 0; i < annotations.length; i++) {
      var annotation = annotations[i];

      if (annotation instanceof RouteConfig) {
        throw new BaseException(
            `Child routes are not allowed for "${path}". Use "..." on the parent's route path.`);
      }
    }
  }
}
