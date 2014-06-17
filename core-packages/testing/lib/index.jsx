#include ../../../dependencies/jasmine.js

exports.jasmine = jasmine;
exports.spyOn = spyOn;
exports.it = it;
exports.xit = xit;
exports.expect = expect;
exports.runs = runs;
exports.waits = waits;
exports.waitsFor = waitsFor;
exports.beforeEach = beforeEach;
exports.afterEach = afterEach;
exports.describe = describe;
exports.xdescribe = xdescribe;

var Template = require("templating").Template;

var TestRunner = function () {
	this._clean_results = function (suites, results) {
		var self = this
		var cleaned_results = suites.map(function(suite) {


			var specs = suite.children.map(function (spec) {
				if(spec.type === 'suite'){
					return self._clean_results([spec], results)[0]
				}
				else {

					return {
						'name': spec.name,
						'result': results[spec.id].result,
						'messages': results[spec.id].messages,
						'type': 'spec'
					}
				}
			});

			var total = specs.reduce(function(a,b){
				if(b.type === 'suite'){
					return a + b.total
				} else {
					return a + 1
				}
			}, 0);
			var passed = specs.reduce(function(a,b){
				if(b.type === 'suite'){
					return a + b.total
				} else {
					if(b.result == "passed"){
						return a + 1
					} else {
						return a;
					}
				}
			}, 0);

			return {
				'name': suite.name,
				'passed': passed,
				'failed': new Number(total - passed),
				'total': total,
				'specs': specs,
				'type': 'suite'
				};
		});
		return cleaned_results;
	}


	this.run = function () {
		if(this.results) return this.results;
		var reporter = new jasmine.JsApiReporter();
		jasmine.getEnv().addReporter(reporter);
		jasmine.getEnv().execute();
		this.results = this._clean_results(reporter.suites_, reporter.results());
		return this.results
	}

	this.get_environment = function () {
		var env = {
			'OS': $.os,
			'ExtendScript build': $.build,
			'ExtendScript version': $.version,
			'path': $.includePath,
			'locale': $.locale,
			'app': app.name,
			'app version': app.version
		}
		return env.keys().map(function (key) {
			return {'key': key, 'value': env[key]};
		});
	}

	// we'll add this into the html representation,
	// so people can upload structured test reports to our central server.
	this.as_json = function () {
	
	}

	this.print_suite = function(suite){
		var self = this;
		suite.specs.forEach(function(spec) {
			if(spec.type == 'suite'){
				self.print_suite(spec)
			}
			else {
				$.writeln("\t" + spec.result.toUpperCase() + "\t" + spec.name);
				if(spec.result != 'passed'){
					$.writeln('\t\t'+spec.messages.join('\n\t\t'))
				}
			}
		});
	}

	this.to_console = function () {
		var results = this.run();
		var self = this
		results.forEach(function(suite) {
			$.writeln("\nSuite: {} \tran {} tests, {} failure(s)".format(suite.name, suite.total, suite.failed));
			self.print_suite(suite)
		});
	}


	this.to_log = function () {
		// todo
	}

	this.flatten = function(specs, res) {
		res = res || [];
		var self = this
		specs.forEach(function(el){
			if(el.type === 'suite'){
				self.flatten(el.specs, res)
			} else {
				res.push(el)
			}
		})

		return res;
	}

	this.to_html = function (filename) {
		// some background info
		var datetime = new Date();
		var date = datetime.toDateString();
		var time = "{}:{}".format(datetime.getHours(), datetime.getMinutes());
		var environment = this.get_environment();

		// run tests
		var results = this.run();
		var self = this

		// tidy up results
		results.forEach(function(suite) {
			var prevSpecs = self.flatten(suite.specs);

			suite.specs = prevSpecs;
			suite.specs.forEach(function(spec) {
				if (spec.result == 'failed') {
					var messages = spec.messages.reject(function (message) {
						return message == 'Passed.';
					});
					spec.problem = '<p class="problem">{}</p>'.format(messages.join("<br />"));
				} else {
					spec.problem = '';
				}
			});
		});

		var duration = ((new Date().getTime() - datetime.getTime())/1000).toFixed(2);

		var template = new Template("report.html", module);
		template.render({
		  'date': date,
		  'time': time,
		  'duration': duration,
		  'suites': results,
		  'total': results.sum('total'),
		  'fails': results.sum('failed'),
		  'passes': results.sum('passed'),
		  'environment': environment
		});
		template.write_to(filename);
	}

	// would be incredibly interesting to see usage patterns and whether certain tests
	// fail consistently on the same platform or app version or ...
	this.to_central_server = function () {
		// todo
	}
}

exports.tests = new TestRunner();