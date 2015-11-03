import {isPresent, isBlank} from 'angular2/src/facade/lang';
import {BaseException, WrappedException} from 'angular2/src/facade/exceptions';
import {PromiseWrapper} from 'angular2/src/facade/promise';
import {Map, MapWrapper, ListWrapper, StringMapWrapper} from 'angular2/src/facade/collection';

import {Route, AsyncRoute, AuxRoute, Redirect, RouteDefinition} from './route_config_impl';
import {AsyncRouteHandler} from './async_route_handler';
import {SyncRouteHandler} from './sync_route_handler';

import {RouteHandler} from './route_handler';

import {Url} from './url_parser';
import {ComponentInstruction} from './instruction';
import {PathRecognizer} from './path_recognizer';
import {RouteRegistry} from './route_registry';
import {Instruction, ResolvedInstruction} from './instruction';



export class Match {}

export interface AbstractRecognizer {
  hash: string;
  path: string;
  recognize(beginningSegment: Url): Promise<Match>;
  generate(params: {[key: string]: any}): ComponentInstruction;
}


export class PathMatch extends Match {
  constructor(public instruction: ComponentInstruction, public remaining: Url,
              public remainingAux: Url[]) {
    super();
  }
}


export class RedirectMatch extends Match {
  constructor(public redirectTo: any[], public specificity) { super(); }
}

export class RedirectRecognizer implements AbstractRecognizer {
  private _pathRecognizer: PathRecognizer;
  public hash: string;

  constructor(public path: string, public redirectTo: any[]) {
    this._pathRecognizer = new PathRecognizer(path);
    this.hash = this._pathRecognizer.hash;
  }

  /**
   * Returns `null` or a `ParsedUrl` representing the new path to match
   */
  recognize(beginningSegment: Url): Promise<Match> {
    var match = null;
    if (isPresent(this._pathRecognizer.recognize(beginningSegment))) {
      match = new RedirectMatch(this.redirectTo, this._pathRecognizer.specificity);
    }
    return PromiseWrapper.resolve(match);
  }

  generate(params: {[key: string]: any}): ComponentInstruction {
    throw new BaseException(`Tried to generate a redirect.`)
  }
}


// represents something like '/foo/:bar'
export class RouteRecognizer implements AbstractRecognizer {
  specificity: number;
  terminal: boolean = true;
  hash: string;

  private _cache: Map<string, ComponentInstruction> = new Map<string, ComponentInstruction>();
  private _pathRecognizer: PathRecognizer;

  // TODO: cache component instruction instances by params and by ParsedUrl instance

  constructor(public path: string, public handler: RouteHandler) {
    this._pathRecognizer = new PathRecognizer(path);

    // TODO: finish this refactor
    this.specificity = this._pathRecognizer.specificity;
    this.hash = this._pathRecognizer.hash;
    this.terminal = this._pathRecognizer.terminal;
  }

  recognize(beginningSegment: Url): Promise<Match> {
    var res = this._pathRecognizer.recognize(beginningSegment);
    if (isBlank(res)) {
      return null;
    }

    return this.handler.resolveComponentType().then((componentType) => {
      var componentInstruction = this._getInstruction(res.urlPath, res.urlParams, res.allParams);
      return new PathMatch(componentInstruction, res.nextSegment, res.auxiliary);
    });
  }

  generate(params: {[key: string]: any}): ComponentInstruction {
    var generated = this._pathRecognizer.generate(params);
    var urlPath = generated['urlPath'];
    var urlParams = generated['urlParams'];
    return this._getInstruction(urlPath, urlParams, params);
  }

  generateStrings(params: {[key: string]: any}): any {
    return this._pathRecognizer.generate(params);
  }

  private _getInstruction(urlPath: string, urlParams: string[],
                          params: {[key: string]: any}): ComponentInstruction {
    if (!this.handler.componentType) {
      throw new BaseException(`Tried to get instruction before loaded.`);
    }

    var hashKey = urlPath + '?' + urlParams.join('?');
    if (this._cache.has(hashKey)) {
      return this._cache.get(hashKey);
    }
    var instruction =
        new ComponentInstruction(urlPath, urlParams, this.handler.data, this.handler.componentType,
                                 this.terminal, this.specificity, params);
    this._cache.set(hashKey, instruction);

    return instruction;
  }
}
