//PROJECT: hyprEVO 4

// -- Var -- //

//PLUGINS//
var gulp = require('gulp');
var sass = require('gulp-sass')(require('sass'));
var cleanCSS = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var wait = require("gulp-wait");
var dirSync = require("gulp-directory-sync");
var imagemin = require('gulp-imagemin');
var concat = require('gulp-concat');
var clean = require('gulp-rimraf');
var ftp = require('vinyl-ftp');
// runSequence no longer needed in Gulp 4
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var autoprefixer = require('gulp-autoprefixer');
var fileinclude = require('gulp-file-include');
var localFilesGlob = ['./build/**'];


//PROJECTS//
var localDir = "http://localhost/SQ/";
var srcDir = "./src/";
var buildDir = "./build/";
var altDir = "C:/xampp/htdocs/SQ/";


// -- UTIL -- //


//Kill build dir
gulp.task('clean', function () {
    return gulp.src('./build', {
        read: false,
        allowEmpty: true
    }) // much faster
        .pipe(wait(1000))
        .pipe(clean());
});

//Spin up local server
gulp.task('sync', function () {
    browserSync.init({
        proxy: localDir
    });

});

//Reload Browser
gulp.task('reload', function () {
    return gulp.src('')
        .pipe(wait(2000))
        .pipe(browserSync.stream());
});


// -- BASE BUILD TASKS -- //


//Compile SCSS,make-styles --> build
gulp.task('make-styles', function () {
    return gulp.src(srcDir + 'scss/style.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS({
            compatibility: 'ie8'
        }))
        .pipe(autoprefixer())
        .pipe(gulp.dest(buildDir + 'css/'))
        .pipe(gulp.dest(altDir + 'css/'));
});
//Compile JS, make-js --> build
gulp.task('make-js', function () {

    return gulp.src([srcDir + 'js/lib/*.js', srcDir + 'js/core/*.js'])
        .pipe(concat('app.js'))
        // .pipe(uglify()) // Temporarily disabled due to syntax error
        .pipe(gulp.dest(buildDir + 'js/'))
        .pipe(gulp.dest(altDir + 'js/'));
});

//Image min, make-image --> build
gulp.task('make-image', function () {
    return gulp.src(srcDir + 'img/**/**')
        .pipe(imagemin())
        .pipe(gulp.dest(buildDir + 'img/'))
        .pipe(gulp.dest(altDir + 'img/'))

});

//Build everything make-rest --> build
gulp.task('make-rest', function () {
    var ignoreList = ['**/*.html', 'modules', 'img', 'scss', 'css', 'js', 'js/**', 'partials', 'notes'];
    return gulp.src(srcDir + '**/*')
        .pipe(dirSync(srcDir, buildDir, {
            ignore: ignoreList
        }))
        .pipe(dirSync(srcDir, altDir, {
            ignore: ignoreList
        }));
});

gulp.task('make-html', function () {
    console.log('Starting make-html task...');
    return gulp.src([srcDir + 'index.html'])
        .on('data', function(file) {
            console.log('Processing file:', file.path);
        })
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file',
            context: {}
        }))
        .on('error', function(err) {
            console.log('File include error:', err);
        })
        .on('data', function(file) {
            console.log('After fileinclude, file content length:', file.contents.length);
        })
        .pipe(gulp.dest(altDir))
        .pipe(gulp.dest(buildDir));
});
//(styles, js,, sync rest)
gulp.task('construct', gulp.series('clean', 'make-styles', 'make-html', 'make-js'));

//(styles, js, image, sync rest)
gulp.task('construct-all', gulp.series('clean', 'make-styles', 'make-html', 'make-js', 'make-image', 'make-rest'));


//-- WATCHERS --//


gulp.task('watch', function () {
    //Source
    gulp.watch(['./src/*.html', './src/modules/*.html', './src/modules/stasis/*.html', './src/modules/handlebars/*.html', './src/*.html'], gulp.series('construct', 'reload'));
    gulp.watch(['./src/*.php'], gulp.series('construct', 'reload'));
    gulp.watch(['./src/scss/*.scss', './src/scss/*/*.scss'], gulp.series('construct', 'reload'));
    gulp.watch(['./src/js/**/*.js'], gulp.series('construct', 'reload'));
    gulp.watch(['./src/img/**'], gulp.series('construct', 'reload'));
});


// -- Default -- //

gulp.task('local', gulp.series('clean', 'construct', gulp.parallel('sync', 'watch')));
gulp.task('serve', gulp.parallel('sync', 'watch'));
gulp.task('makeBuild', gulp.series('clean', 'construct-all'));