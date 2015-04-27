echo '---------compressing-------------'

find static/app/scripts/controllers/ static/app/scripts/services/ static/app/scripts/directives/ -name "*.js"  -exec cat {} + > static/app/scripts/servicectrls.min.js
#java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/app/scripts/servicectrls.min.js -o static/app/scripts/servicectrls.min.js

cat static/bower_components/restangular/dist/restangular.min.js static/bower_components/satellizer/satellizer.min.js  static/bower_components/angular-local-storage/dist/angular-local-storage.min.js  static/bower_components/ngImgCrop/compile/minified/ng-img-crop.js static/bower_components/ng-tags-input/ng-tags-input.min.js static/bower_components/angular-busy/dist/angular-busy.min.js  > static/bower_components/allbower.min.js
#java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/bower_components/allbower.min.js -o static/bower_components/allbower.min.js

echo '---------compressing----------------socket.io.js----------->>>'
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/bower_components/socket.io.js -o static/bower_components/socket.io.min.js

echo '-----------compressiong-------------ngSocket.min.js--->>>'
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/bower_components/ngSocket.js -o static/bower_components/ngSocket.min.js

echo 'compressing------autocomplete--->>>'
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/bower_components/angucomplete/autocomplete.js -o static/bower_components/angucomplete/autocomplete.min.js

cat static/bower_components/socket.io.min.js  static/bower_components/ngSocket.min.js  static/bower_components/angucomplete/autocomplete.min.js > static/bower_components/sockt_ng_autocomplete.min.js

echo '-----------compression done-----------'


echo '-----css file combine-----'

cat static/app/styles/main.css \
static/app/styles/chat_css.css \
static/bower_components/ngImgCrop/compile/minified/ng-img-crop.css \
static/bower_components/ng-tags-input/ng-tags-input.css \
static/bower_components/ng-tags-input/ng-tags-input.bootstrap.css \
static/bower_components/angular-busy/dist/angular-busy.min.css \
static/bower_components/angucomplete/autocomplete.css \
static/bower_components/angucomplete/style.css > static/bower_components/allcss.css

echo '-----------min all css file------------'
java -jar /usr/share/yui-compressor/yui-compressor.jar --type css -v static/bower_components/allcss.css -o static/bower_components/allcss.min.css

