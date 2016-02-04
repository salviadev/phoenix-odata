var path = require('path');
var gulp = require('gulp');
var del = require('del');
var merge = require('merge2');
var ts = require('gulp-typescript');
var dts = require('dts-bundle');
var runSequence = require('run-sequence');


gulp.task('clean', function () {
    return del([
        'lib/',
        './index.js'
    ]);

});

gulp.task('definition-bundle', function () {
    dts.bundle({
        name: 'phoenix-odata',
        main: 'lib/definitions/index.d.ts',
        exclude: /.*typings.*/,
        verbose: false
    });
});


gulp.task('ts', ['clean'], function () {
    var tsProject = ts.createProject(path.resolve('./src/tsconfig.json'));
    var tsResult = gulp.src(path.resolve('./src/**/*.ts')).pipe(ts(tsProject));
    return merge([ // Merge the two output streams, so this task is finished when the IO of both operations are done.
        tsResult.dts.pipe(gulp.dest('lib/definitions')),
        tsResult.js.pipe(gulp.dest(path.resolve('./')))
    ]);

});

gulp.task('build', function (done) {
    runSequence('ts', 'definition-bundle', done);
});

gulp.task('default', ['build']);