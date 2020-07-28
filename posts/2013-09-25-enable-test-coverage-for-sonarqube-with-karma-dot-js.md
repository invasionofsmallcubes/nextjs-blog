---
title: 'Enable test coverage for SonarQube with Karma.js'
date: '2013-09-25'
---
Recently I had to integrate the test coverage of our javascript projects into SonarQube. I'm using Karma.js 0.8.5 so the config file has the old syntax layout but it applies also to the new type of configuration.

This is a quick post with the necessary configuration.

First declare a *coverageReporter* of type **lcov**.

~~~ javascript
coverageReporter = {
	type : 'lcov',
	dir : 'build/reports/coverage/'
}
~~~

Then declare **coverage** as one of the *reporters*

~~~ javascript
reporters = ['progress', 'dots', 'junit', 'coverage'];
~~~

And your done with the *karma.js* part.

Now, the following part is for **gradle** but I'm pretty sure you'll need the same options with **maven**.

To start karma I created a gradle task:

~~~ java
task karmaTest(type:Exec) {

  commandLine "karma", "--singleRun", "true", "--browsers", "PhantomJS", "start", "src/test/js/config/karma.conf.js"

  standardOutput = new ByteArrayOutputStream()

  ext.output = {
    return standardOutput.toString();
  }
}
~~~

And then

~~~ java
project(":your-project") {
  apply plugin: 'sonar-runner'
  sonarRunner {
    sonarProperties {
      property "sonar.projectName", "Your project"
      property "sonar.projectKey", "com.example:yourproject"
      property "sonar.host.url", "http://localhost:9000"
      property "sonar.jdbc.url", "jdbc:mysql://localhost:3306/sonar?useUnicode=true&characterEncoding=utf8"
      property "sonar.jdbc.driverClassName", "com.mysql.jdbc.Driver"
      property "sonar.jdbc.username", "root"
      property "sonar.jdbc.password", "root"
      property "sonar.projectVersion", "1.0.SNAPSHOT"
      property "sonar.dynamicAnalysis", "reuseReports"
      property "sonar.modules", "java-module,javascript-module"
      property "java-module.sonar.projectName","Java Module"
      property "java-module.sonar.projectBaseDir", "${project.projectDir}"
      property "java-module.sonar.jacoco.reportPath", "build/jacoco/test.exec"

      // JAVASCRIPT MODULE BEGINS
      property "javascript-module.sonar.projectName","JavaScript Module"
      property "javascript-module.sonar.language","js"
      property "javascript-module.sonar.sources","src/main/webapp/js/app"
      property "javascript-module.sonar.tests","src/test/js/spec/"
      property "javascript-module.sonar.projectBaseDir", "$project.projectDir"
      property "javascript-module.sonar.javascript.jstest.reportsPath", "build/reports/tests/"
      property "javascript-module.sonar.javascript.lcov.reportPath", "build/reports/coverage/PhantomJS 1.9 (Linux)/lcov.info"
    }
  }
}
~~~

The annoying thing I can't still resolve is that *lcov.info* is under the directory *PhantomJS 1.9 (Linux)* cannot be renamed, or at least I can't find how.
