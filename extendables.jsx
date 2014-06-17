// we need to log somethings before the log module is loaded,
// so we buffer these messages
var log_buffer = [];

#include "patches/__all__.jsx";
if(!this.standalone) {
	var default_settings = new File("settings.jsx").at(Folder.extendables);
	var project_specific_settings = new File("settings.jsx").at(Folder.extendables.parent);
	
	if (project_specific_settings.exists) {
		// allows for project-specific settings, so nobody
		// has to override anything within /extendables
		// (this feature is currently undocumented)
		log_buffer.push([4, "Loading Extendables with project-specific settings at {}", project_specific_settings]);
		$.evalFile(project_specific_settings);
	} else {
		log_buffer.push([4, "Loading Extendables with default settings"]);
		$.evalFile(default_settings);
	}
	
	var logging = require("logging");
	var syslog = new logging.Log("extendables.log");
	
	log_buffer.forEach(function (message) {
		syslog.log.apply(null, message);
	});
}