import {runBenchmark} from './perf_util';
import {verifyNoBrowserErrors} from 'angular2/testing';

describe('ng2 compiler benchmark', function() {

  var URL = 'benchmarks/src/compiler/compiler_benchmark.html';

  afterEach(verifyNoBrowserErrors);

  it('should log withBindings stats', function(done) {
    browser.sleep(1000);
    runBenchmark({
      url: URL,
      id: 'ng2.compile.withBindings',
      params: [{name: 'elements', value: 150, scale: 'linear'}],
      work: function() {
        browser.executeScript('document.querySelector("#compileWithBindings").click()');
        browser.sleep(500);
      }
    }).then(done, done.fail);
  });

  it('should log noBindings stats', function(done) {
    browser.sleep(1000);
    runBenchmark({
      url: URL,
      id: 'ng2.compile.noBindings',
      params: [{name: 'elements', value: 150, scale: 'linear'}],
      work: function() {
        browser.executeScript('document.querySelector("#compileNoBindings").click()');
        browser.sleep(500);
      }
    }).then(done, done.fail);
  });

});
