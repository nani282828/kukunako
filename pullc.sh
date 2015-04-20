git add -A
git commit -m 'testing'
git pull origin  master


echo '-------compressing------------'
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/app/scripts/controllers/allcontrollers.js  -o static/app/scripts/controllers/allcontrollers.min.js


echo '-------compressing------------'
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/app/scripts/services/allservices.js  -o static/app/scripts/services/allservices.min.js

echo '--compressing ngsocket ---'
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/bower_components/ngSocket.js  -o static/bower_components/ngSocket.min.js

echo '--compressing socketio ---'

java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/bower_components/socket.io.js  -o static/bower_components/socket.io.min.js

service weber restart


